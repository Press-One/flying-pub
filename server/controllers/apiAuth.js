'use strict';

const request = require('request-promise');
const config = require('../config');
const auth = require('../models/auth');
const {
  assert,
  throws,
  Errors
} = require('../models/validator');
const User = require('../models/user');
const Profile = require('../models/profile');
const Wallet = require('../models/wallet');
const Token = require('../models/token');
const Log = require('../models/log');

const providers = ['pressone', 'github', 'mixin'];

const DEFAULT_AVATAR = 'https://static.press.one/pub/avatar.png';

const checkPermission = async (provider, profile) => {
  const {
    providerId
  } = profile;
  const whitelist = config.auth.whitelist[provider];
  const isInWhiteList = whitelist && [provider].includes(~~providerId);
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
  }
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

exports.oauthLogin = async ctx => {
  const {
    authenticate
  } = auth;
  const {
    provider
  } = ctx.params;
  assert(
    providers.includes(provider),
    Errors.ERR_IS_INVALID(`provider: ${provider}`)
  );
  assert(
    authenticate[provider],
    Errors.ERR_IS_INVALID(`provider: ${provider}`)
  );
  assert(ctx.query.redirect, Errors.ERR_IS_REQUIRED('redirect'));
  ctx.session.auth = {
    provider: ctx.params.provider,
    redirect: ctx.query.redirect
  };
  return authenticate[provider](ctx);
};

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
    if (config.settings['permission.isPrivate']) {
      const hasPermission = await checkPermission(provider, profile);
      const noPermission = !hasPermission;
      if (noPermission) {
        Log.createAnonymity(
          profile.id,
          `没有 ${provider} 权限，raw ${profile.raw}`
        );
        const clientHost = ctx.session.auth.redirect.split('/').slice(0, 3).join('/');
        ctx.redirect(`${clientHost}/permissionDeny`);
        return false;
      }
    }

    await login(ctx, user, provider);

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
  const profile = providerGetter[provider](user);
  const isNewUser = !(await Profile.isExist(provider, profile.id));
  let insertedProfile = {};
  if (isNewUser) {
    const userData = {
      providerId: profile.id,
      provider
    };
    if (provider === 'mixin') {
      userData.mixinAccountRaw = profile.raw;
    }
    const user = await User.create(userData);
    insertedProfile = await Profile.createProfile({
      userId: user.id,
      profile,
      provider
    });
    await Wallet.tryCreateWallet(user.id);
    Log.create(user.id, `我被创建了`);
    Log.create(user.id, `钱包不存在，初始化成功`);
  } else {
    insertedProfile = await Profile.get(provider, profile.id);
    Log.create(insertedProfile.userId, `登录成功`);
    const {
      userId
    } = insertedProfile;
    const walletExists = await Wallet.exists(userId);
    if (walletExists) {
      Log.create(userId, `钱包已存在，无需初始化`);
    } else {
      await Wallet.tryCreateWallet(userId);
      Log.create(userId, `钱包不存在，初始化成功`);
    }
    await Profile.update(userId, {
      name: profile.name,
      avatar: profile.avatar,
    });
  }

  const token = await Token.create({
    userId: insertedProfile.userId,
    providerId: insertedProfile.providerId,
    profileRaw: provider === 'mixin' ? profile.raw : '',
    provider
  });

  const cookieOptions = {
    expires: new Date('2100-01-01')
  }
  if (config.settings['SSO.enabled']) {
    cookieOptions.domain = config.auth.SSOTokenDomain;
  }
  ctx.cookies.set(config.auth.tokenKey, token, cookieOptions);
}

const providerGetter = {
  github: user => {
    return {
      id: user._json.id,
      name: user.username,
      avatar: user._json.avatar_url || DEFAULT_AVATAR,
      bio: user._json.bio,
      raw: user._raw
    };
  },

  mixin: user => {
    return {
      id: user._json.identity_number,
      name: user._json.full_name,
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
      id: user.id,
      name: user.name,
      avatar: user.avatar || DEFAULT_AVATAR,
      bio: user.bio,
      raw: JSON.stringify(user)
    };
  }
};