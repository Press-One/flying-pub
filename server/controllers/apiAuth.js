'use strict';

const request = require('request-promise');
const config = require('../config');
const auth = require('../models/auth');
const {
  assert,
  throws,
  Errors
} = require('../utils/validator');
const User = require('../models/user');
const Profile = require('../models/profile');
const Wallet = require('../models/wallet');
const Token = require('../models/token');
const Block = require('../models/block');
const Permission = require('../models/permission');
const Chain = require('./chain');
const Log = require('../models/log');
const {
  sendSmsCode,
  verifySmsCode
} = require('../models/verifycode');

const providers = ['pressone', 'github', 'mixin', 'phone'];

const DEFAULT_AVATAR = 'https://static.press.one/pub/avatar.png';

const checkPermission = async (provider, profile) => {
  const {
    providerId
  } = profile;
  const whitelist = config.auth.whitelist[provider];
  const isInWhiteList = whitelist && whitelist.includes(parseInt(providerId));
  if (isInWhiteList) {
    return true;
  }
  const hasProviderPermission = await providerPermissionChecker[provider](profile);
  return hasProviderPermission;
}

const providerPermissionChecker = {
  mixin: async profile => {
    const rawJson = JSON.parse(profile.raw);
    const IsInMixinBoxGroup = await checkIsInMixinBoxGroup(rawJson.user_id);
    return IsInMixinBoxGroup;
  },
  github: async profile => {
    const isPaidUserOfXue = await checkIsPaidUserOfXue(profile.name);
    return isPaidUserOfXue;
  },
  pressone: async () => {
    return true;
  },
  phone: async () => {
    return true;
  },
};

const checkIsInMixinBoxGroup = async mixinUuid => {
  try {
    const res = await request({
      uri: `${config.auth.boxGroupAuthBaseApi}/${mixinUuid}`,
      json: true,
      headers: {
        group_id: config.auth.boxGroupId,
        Authorization: `Bearer ${config.auth.boxGroupToken}`
      },
    }).promise();
    const isValid = res.user_id === mixinUuid;
    return isValid;
  } catch (err) {
    console.log(err);
    return false;
  }
}

const checkIsPaidUserOfXue = async githubNickName => {
  try {
    const user = await request({
      uri: `${config.auth.xueUserExtraApi}/${githubNickName}`,
      json: true,
      headers: {
        'x-po-auth-token': config.auth.xueAdminToken
      },
    }).promise();
    const isPaidUser = user.balance > 0;
    return isPaidUser;
  } catch (err) {
    return false;
  }
}

const oauth = (ctx, oauthType) => {
  const {
    authenticate
  } = auth;
  const {
    provider
  } = ctx.params;
  assert(authenticate[provider], Errors.ERR_IS_INVALID(`provider: ${provider}`));
  assert(ctx.query.redirect, Errors.ERR_IS_REQUIRED('redirect'));
  ctx.session.oauthType = oauthType;
  ctx.session.auth = {
    provider: ctx.params.provider,
    redirect: ctx.query.redirect
  };
  return authenticate[provider](ctx);
}

exports.oauthLogin = async ctx => {
  return oauth(ctx, 'login');
}

exports.oauthCallback = async ctx => {
  try {
    const {
      provider
    } = ctx.params;

    let user;
    if (provider === 'pressone') {
      user = await handlePressOneCallback(ctx, provider);
    } else {
      user = await handleOauthCallback(ctx, provider);
    }
    assert(user, Errors.ERR_NOT_FOUND(`${provider} user`));

    const profile = providerGetter[provider](user);

    const {
      oauthType
    } = ctx.session;
    assert(oauthType, Errors.ERR_IS_REQUIRED('oauthType'));

    if (oauthType === 'login') {
      if (config.settings['permission.isPrivate']) {
        const hasPermission = await checkPermission(provider, profile);
        const noPermission = !hasPermission;
        if (noPermission) {
          Log.createAnonymity(
            profile.providerId,
            `没有 ${provider} 权限，raw ${profile.raw}`
          );
          const clientHost = ctx.session.auth.redirect.split('/').slice(0, 3).join('/');
          ctx.redirect(`${clientHost}?action=PERMISSION_DENY`);
          return false;
        }
      }
      await login(ctx, user, provider);
    } else if (oauthType === 'bind') {
      assert(user, Errors.ERR_NOT_FOUND(`${provider} user`));
      const queryStart = ctx.session.auth.redirect.includes('?') ? '&' : '?';
      const existed_profile = await Profile.get(provider, profile.providerId);
      if (existed_profile) {
        ctx.redirect(`${ctx.session.auth.redirect}${queryStart}action=BIND_DUPLICATED&code=409&message=duplicate_provider&provider=${provider}`);
        return;
      }

      // add new record to profiles table
      const userId = ctx.verification && ctx.verification.user.id;
      await Profile.createProfile({
        userId,
        profile,
      });
      Log.create(userId, `绑定 ${provider}`);

      ctx.redirect(`${ctx.session.auth.redirect}${queryStart}action=BIND_SUCCESS`);
      return;
    }
    ctx.redirect(ctx.session.auth.redirect);
  } catch (err) {
    console.log(err);
    throws(Errors.ERR_FAIL_TO_LOGIN);
  }
};

const handlePressOneCallback = async (ctx, provider) => {
  const {
    userAddress
  } = ctx.query;
  assert(userAddress, Errors.ERR_IS_REQUIRED('userAddress'));
  const user = await request({
    uri: `https://press.one/api/v2/users/${userAddress}`,
    json: true,
    headers: {
      accept: 'application/json'
    }
  }).promise();
  return user;
};

const handleOauthCallback = async (ctx, provider) => {
  const {
    authenticate
  } = auth;
  assert(
    authenticate[provider],
    Errors.ERR_IS_INVALID(`provider: ${provider}`)
  );
  assert(ctx.session, Errors.ERR_IS_REQUIRED('session'));
  assert(ctx.session.oauthType, Errors.ERR_IS_REQUIRED('session.oauthType'));
  assert(ctx.session.auth, Errors.ERR_IS_REQUIRED('session.auth'));
  assert(
    ctx.session.auth.redirect,
    Errors.ERR_IS_REQUIRED('session.auth.redirect')
  );
  assert(
    ctx.session.auth.provider === provider,
    Errors.ERR_IS_INVALID(`provider mismatch: ${provider}`)
  );

  await authenticate[provider](ctx, () => {});
  assert(ctx.session, Errors.ERR_IS_REQUIRED('session'));
  assert(ctx.session.passport, Errors.ERR_IS_REQUIRED('session.passport'));
  assert(
    ctx.session.passport.user,
    Errors.ERR_IS_REQUIRED('session.passport.user')
  );
  assert(
    ctx.session.passport.user.auth,
    Errors.ERR_IS_REQUIRED('session.passport.user.auth')
  );
  assert(
    ctx.session.passport.user.auth.accessToken,
    Errors.ERR_IS_REQUIRED('session.passport.user.auth.accessToken')
  );
  assert(
    ctx.session.passport.user.provider === provider,
    Errors.ERR_IS_INVALID(`provider mismatch: ${provider}`)
  );

  const {
    user
  } = ctx.session.passport;
  return user;
};

const login = async (ctx, user, provider) => {
  assert(provider === 'mixin' || providers.includes(provider), Errors.ERR_IS_INVALID(`provider: ${provider}`))

  const profile = providerGetter[provider](user);
  const isNewUser = !(await Profile.isExist(provider, profile.providerId));
  let insertedProfile = {};
  if (isNewUser) {
    const userData = {
      nickname: profile.nickname || profile.name,
      bio: profile.bio,
      avatar: profile.avatar || DEFAULT_AVATAR,
    };
    if (provider === 'mixin') {
      userData.mixinAccountRaw = profile.raw;
    }
    const user = await User.create(userData);
    insertedProfile = await Profile.createProfile({
      userId: user.id,
      profile,
    });
    await Wallet.tryCreateWallet(user.address, user.nickname);
    Log.create(user.id, `我被创建了`);
    Log.create(user.id, `钱包不存在，初始化成功`);
  } else {
    insertedProfile = await Profile.get(provider, profile.providerId);
    Log.create(insertedProfile.userId, `登录成功`);
    const {
      userId
    } = insertedProfile;
    const user = await User.get(userId);
    const walletExists = await Wallet.exists(user.address);
    if (walletExists) {
      Log.create(userId, `钱包已存在，无需初始化`);
    } else {
      await Wallet.tryCreateWallet(user.address, user.nickname);
      if (user.version !== 1) {
        Log.create(userId, `version 为 0，钱包不存在 ！！！`);
      }
      Log.create(userId, `钱包不存在，初始化成功`);
    }
  }

  const topicAddress = config.topic.address;
  const insertedUser = await User.get(insertedProfile.userId);
  const allowBlock = await Block.getAllowBlock(topicAddress, insertedUser.address);

  if (topicAddress && !allowBlock) {
    await Permission.setPermission({
      userAddress: insertedUser.address,
      topicAddress,
      type: 'allow',
    })

    const block = await Chain.pushTopic({
      userAddress: insertedUser.address,
      topicAddress,
      type: 'allow',
    });
    Log.create(insertedProfile.userId, `提交 allow 区块, blockId ${block.id}`);
  }

  assert(profile.raw, Errors.ERR_IS_REQUIRED('profile.raw'));
  const token = await Token.create({
    userId: insertedProfile.userId,
    providerId: insertedProfile.providerId,
    profileRaw: profile.raw,
    provider
  });

  const cookieOptions = {
    expires: new Date('2100-01-01')
  }
  if (config.auth.tokenDomain) {
    cookieOptions.domain = config.auth.tokenDomain;
  }
  ctx.cookies.set(config.auth.tokenKey, token, cookieOptions);
}

exports.getPermission = async ctx => {
  const {
    user
  } = ctx.verification;

  if (config.settings['permission.allowedProviders']) {
    const allowedProviders = config.settings['permission.allowedProviders'];
    const profiles = await Profile.getByUserId(user.id);
    let passed = false;
    for (const profile of profiles) {
      if (allowedProviders.includes(profile.provider)) {
        passed = true;
      }
    }
    assert(passed, Errors.ERR_NO_PERMISSION);
  }

  if (config.settings['permission.isOnlyPubPrivate']) {
    const mixinProfile = await Profile.getByUserIdAndProvider(user.id, 'mixin');
    assert(mixinProfile, Errors.ERR_NO_PERMISSION);
    const hasProviderPermission = await checkPermission('mixin', mixinProfile);
    assert(hasProviderPermission, Errors.ERR_NO_PERMISSION);
  }

  ctx.body = {
    success: true
  }
}

exports.sendSmsCodeHandler = async ctx => {
  const {
    phone
  } = ctx.request.body || {}

  await sendSmsCode(phone);
  ctx.body = {
    success: true
  }
};

exports.verifySmsCodeHandler = async ctx => {
  const {
    phone,
    code
  } = ctx.request.body || {}

  await verifySmsCode(phone, code);

  try {
    const provider = 'phone';
    const user = {
      name: phone,
    };
    await login(ctx, user, provider);
  } catch (err) {
    console.log(err);
    throws(Errors.ERR_FAIL_TO_LOGIN);
  }

  ctx.body = {
    success: true
  }
};

exports.loginWithPassword = async ctx => {
  const {
    phone,
    password
  } = ctx.request.body || {}
  const provider = 'phone';
  const providerId = phone;

  assert(phone, Errors.ERR_IS_REQUIRED('phone'));
  assert(password, Errors.ERR_IS_REQUIRED('password'));

  const profile = await Profile.get(provider, providerId);
  assert(profile, Errors.ERR_NOT_FOUND('profile'));

  const success = await Profile.verifyUserPassword(profile.userId, password, provider);
  if (!success) {
    throws(Errors.ERR_IS_INVALID('phone or password'));
  }
  try {
    const user = {
      name: phone,
    };
    await login(ctx, user, provider);
  } catch (err) {
    console.log(err);
    throws(Errors.ERR_FAIL_TO_LOGIN);
  }

  ctx.body = {
    success: true
  }
}

// 绑定帐号，相当于为用户增加一个profile
// 绑定手机号
exports.phoneBind = async (ctx) => {
  const {
    user,
    profile,
  } = ctx.verification;
  const userId = user.id;
  const provider = 'phone';

  const {
    phone,
    code
  } = ctx.request.body || {};
  assert(phone, Errors.ERR_IS_INVALID('phone'));
  assert(code, Errors.ERR_IS_INVALID('code'));

  if (await Profile.isExist(provider, phone)) {
    throws(Errors.ERR_IS_DUPLICATED('alread bind phone'));
  }

  await verifySmsCode(phone, code);
  const phone_user = {
    name: phone,
  };
  const insertedProfile = await Profile.createProfile({
    userId,
    profile: providerGetter[provider](phone_user),
  });

  ctx.body = insertedProfile;

  Log.create(user.id, `绑定手机号`);
}

// 绑定其它帐号都通过 `oauthBind` 完成
exports.oauthBind = async ctx => {
  return oauth(ctx, 'bind');
};

const providerGetter = {
  github: user => {
    return {
      provider: 'github',
      providerId: user._json.id,
      name: user.username,
      nickname: user.username,
      avatar: user._json.avatar_url || DEFAULT_AVATAR,
      bio: user._json.bio,
      raw: user._raw
    };
  },

  mixin: user => {
    return {
      provider: 'mixin',
      providerId: user._json.identity_number,
      name: user._json.full_name,
      nickname: user._json.full_name,
      avatar: user._json.avatar_url || DEFAULT_AVATAR,
      bio: '',
      raw: JSON.stringify({
        user_id: user._json.user_id,
        full_name: user._json.full_name,
        identity_number: user._json.identity_number,
        biography: user._json.biography,
        avatar_url: user._json.avatar_url,
        session_id: user._json.session_id,
        code_id: user._json.code_id,
      })
    };
  },

  pressone: user => {
    delete user.proofs;
    return {
      provider: 'pressone',
      providerId: user.id,
      name: user.name,
      nickname: user.name,
      avatar: user.avatar || DEFAULT_AVATAR,
      bio: user.bio,
      raw: JSON.stringify(user)
    };
  },

  phone: user => {
    return {
      provider: 'phone',
      providerId: parseInt(user.name),
      name: user.name,
      nickname: user.name.slice(-4), // 手机号码后四位作为初始昵称
      avatar: DEFAULT_AVATAR,
      raw: JSON.stringify(user)
    }
  },
};