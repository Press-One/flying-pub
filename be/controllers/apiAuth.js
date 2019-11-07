'use strict';

const request = require('request-promise');
const config = require('../config');
const auth = require('../models/auth');
const {
  assert,
  Errors
} = require('../models/validator');
const User = require('../models/user');
const Profile = require('../models/profile');
const Wallet = require('../models/wallet');
const Token = require('../models/token');
const Log = require('../models/log');

const providers = ['pressone', 'github', 'mixin'];

const DEFAULT_AVATAR = 'https://static.press.one/pub/avatar.png';

exports.oauthLogin = async ctx => {
  const {
    authenticate
  } = auth;
  const {
    provider
  } = ctx.params;
  assert(providers.includes(provider), Errors.ERR_IS_INVALID(`provider: ${provider}`))
  assert(authenticate[provider], Errors.ERR_IS_INVALID(`provider: ${provider}`));
  assert(ctx.query.redirect, Errors.ERR_IS_REQUIRED('redirect'));
  ctx.session.auth = {
    provider: ctx.params.provider,
    redirect: ctx.query.redirect
  };
  return authenticate[provider](ctx);
};

const checkPermission = async (provider, profile) => {
  const providerId = profile.id;
  const isInWhiteList = config.whitelist[provider].includes(~~providerId);
  if (isInWhiteList) {
    return true;
  }
  const hasProviderPermission = await providerPermissionChecker[provider](profile);
  return hasProviderPermission;
}

const providerPermissionChecker = {
  mixin: async profile => {
    return true;
    // const rawJson = JSON.parse(profile.raw);
    // const IsInMixinBoxGroup = await checkIsInMixinBoxGroup(rawJson.user_id);
    // return IsInMixinBoxGroup;
  },
  github: async () => {
    return true;
  },
};

// const checkIsInMixinBoxGroup = async mixinUuid => {
//   try {
//     await request({
//       uri: `https://xiaolai-ri-openapi.groups.xue.cn/v1/users/${mixinUuid}`,
//       json: true,
//       headers: {
//         Authorization: `Bearer ${config.boxGroupToken}`
//       },
//     }).promise();
//     return true;
//   } catch (err) {
//     return false;
//   }
// }

exports.oauthCallback = async (ctx, next) => {
  const {
    provider
  } = ctx.params;

  let user;
  if (provider === 'pressone') {
    user = await handlePressOneCallback(ctx, provider);
  } else {
    user = await handleOauthCallback(ctx, next, provider);
  }

  assert(user, Errors.ERR_NOT_FOUND(`${provider} user`));

  const profile = providerGetter[provider](user);
  Log.createAnonymity(profile.id, `登陆 oauth 成功`);
  const hasPermission = await checkPermission(provider, profile);
  const noPermission = !hasPermission;
  if (noPermission) {
    Log.createAnonymity(profile.id, `没有 ${provider} 权限，raw ${profile.raw}`);
    ctx.redirect(config.permissionDenyUrl);
    return false;
  }

  await login(ctx, user, provider);

  ctx.redirect(ctx.session.auth.redirect);
}

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
    },
  }).promise();
  return user
}

const handleOauthCallback = async (ctx, next, provider) => {
  const {
    authenticate
  } = auth;
  assert(authenticate[provider], Errors.ERR_IS_INVALID(`provider: ${provider}`))
  assert(ctx.session, Errors.ERR_IS_REQUIRED('session'));
  assert(ctx.session.auth, Errors.ERR_IS_REQUIRED('session.auth'));
  assert(ctx.session.auth.redirect, Errors.ERR_IS_REQUIRED('session.auth.redirect'));
  assert(ctx.session.auth.provider === provider, Errors.ERR_IS_INVALID(`provider mismatch: ${provider}`));

  await authenticate[provider](ctx, next);
  assert(ctx.session, Errors.ERR_IS_REQUIRED('session'));
  assert(ctx.session.passport, Errors.ERR_IS_REQUIRED('session.passport'));
  assert(ctx.session.passport.user, Errors.ERR_IS_REQUIRED('session.passport.user'));
  assert(ctx.session.passport.user.auth, Errors.ERR_IS_REQUIRED('session.passport.user.auth'));
  assert(ctx.session.passport.user.auth.accessToken, Errors.ERR_IS_REQUIRED('session.passport.user.auth.accessToken'));
  assert(ctx.session.passport.user.provider === provider, Errors.ERR_IS_INVALID(`provider mismatch: ${provider}`));

  const {
    user
  } = ctx.session.passport;
  return user;
}

const login = async (ctx, user, provider) => {
  const profile = providerGetter[provider](user);
  const isNewUser = !await Profile.isExist(profile.id, {
    provider,
  });
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
    Log.create(insertedProfile.userId, `我被创建了`);
  } else {
    insertedProfile = await Profile.get(profile.id);
    Log.create(insertedProfile.userId, `登陆成功`);
    const {
      userId
    } = insertedProfile;
    const wallet = await Wallet.getByUserId(userId, {
      isRaw: true
    });
    if (!wallet) {
      Wallet.tryCreateWallet(userId);
    } else {
      console.log(`${userId}： 钱包已存在，无需初始化`);
      Log.create(userId, `钱包 ${JSON.stringify(wallet)}`);
      Log.create(userId, `钱包已存在，无需初始化`);
    }
  }

  const token = await Token.create({
    userId: insertedProfile.userId,
    providerId: insertedProfile.providerId
  });

  ctx.cookies.set(
    config.authTokenKey,
    token, {
      expires: new Date('2100-01-01')
    }
  )
}

const providerGetter = {
  github: user => {
    return {
      id: user._json.id,
      name: user.username,
      avatar: user._json.avatar_url || DEFAULT_AVATAR,
      bio: user._json.bio,
      raw: user._raw,
    };
  },

  mixin: user => {
    return {
      id: user._json.identity_number,
      name: user._json.full_name,
      avatar: user._json.avatar_url || DEFAULT_AVATAR,
      bio: '',
      raw: JSON.stringify(user._json)
    }
  },

  pressone: user => {
    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar || DEFAULT_AVATAR,
      bio: user.bio,
      raw: JSON.stringify(user)
    }
  }
}