'use strict';

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
const Author = require('../models/author');
const Chain = require('./chain');
const Log = require('../models/log');
const moment = require('moment');
const {
  sendSmsCode,
  verifySmsCode
} = require('../models/verifycode');

const providers = ['mixin', 'phone'];

const DEFAULT_AVATAR = 'https://static-assets.xue.cn/images/435d111.jpg';

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

    const user = await handleOauthCallback(ctx, provider);
    assert(user, Errors.ERR_NOT_FOUND(`${provider} user`));

    const profile = providerGetter[provider](user);

    const {
      oauthType
    } = ctx.session;
    assert(oauthType, Errors.ERR_IS_REQUIRED('oauthType'));

    if (oauthType === 'login') {
      await login(ctx, user, provider);
    } else if (oauthType === 'bind') {
      assert(user, Errors.ERR_NOT_FOUND(`${provider} user`));
      const queryStart = ctx.session.auth.redirect.includes('?') ? '&' : '?';
      const existed_profile = await Profile.get(provider, profile.providerId);
      if (existed_profile) {
        ctx.redirect(`${ctx.session.auth.redirect}${queryStart}action=BIND_DUPLICATED&code=409&message=duplicate_provider&provider=${provider}`);
        return;
      }

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

  delete ctx.session.passport;

  return user;
};

const login = async (ctx, user, provider) => {
  assert(provider === 'mixin' || providers.includes(provider), Errors.ERR_IS_INVALID(`provider: ${provider}`))

  const profile = providerGetter[provider](user);
  const isNewUser = !(await Profile.isExist(provider, profile.providerId));
  let insertedUser;
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
    try {
      await Author.upsert(user.address, {
        status: 'allow',
        nickname: user.nickname || '',
        avatar: user.avatar || '',
        bio: user.bio || '',
      });
    } catch (err) {
      console.log(err)
    }
    insertedUser = user;
    insertedProfile = await Profile.createProfile({
      userId: user.id,
      profile,
    });
    await Wallet.tryCreateWallet(user.address, user.nickname);
    Log.create(user.id, `使用 ${provider} 登录，我被创建了`);
    Log.create(user.id, `钱包不存在，初始化成功`);
  } else {
    insertedProfile = await Profile.get(provider, profile.providerId);
    Log.create(insertedProfile.userId, `使用 ${provider} 登录成功`);
    const {
      userId
    } = insertedProfile;
    const user = await User.get(userId);
    insertedUser = user;
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

  assert(profile.raw, Errors.ERR_IS_REQUIRED('profile.raw'));
  const token = await Token.create({
    userId: insertedProfile.userId,
    providerId: insertedProfile.providerId,
    profileRaw: profile.raw,
    provider
  });

  const cookieOptions = {
    expires: new Date(moment().add(360,'days').format('YYYY-MM-DD'))
  }
  if (config.auth.tokenDomain) {
    cookieOptions.domain = config.auth.tokenDomain;
  }
  ctx.cookies.set(config.auth.tokenKey, token, cookieOptions);

  return insertedUser;
}

exports.getPermission = async ctx => {
  const {
    user
  } = ctx.verification;

  try {
    const topicAddress = config.topic.address;
    const allowBlock = await Block.getAllowBlock(topicAddress, user.address);

    if (topicAddress && !allowBlock) {
      await Permission.setPermission({
        userAddress: user.address,
        topicAddress,
        type: 'allow',
      })

      const block = await Chain.pushTopic({
        userAddress: user.address,
        topicAddress,
        type: 'allow',
      });
      Log.create(user.id, `提交 allow 区块, blockId ${block.id}`);
    }
  } catch (err) {
    console.log(err);
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

  if (config.messageSystem.smsHardCode) {
    if (`${code}` !== config.messageSystem.smsHardCode) {
      await verifySmsCode(phone, code);
    }
  } else {
    await verifySmsCode(phone, code);
  }

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

  if (config.messageSystem.smsHardCode) {
    if (`${code}` !== config.messageSystem.smsHardCode) {
      await verifySmsCode(phone, code);
    }
  } else {
    await verifySmsCode(phone, code);
  }
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

exports.oauthBind = async ctx => {
  return oauth(ctx, 'bind');
};

const providerGetter = {

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