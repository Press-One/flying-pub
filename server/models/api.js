const request = require('request-promise');
const httpStatus = require('http-status');
const config = require('../config');
const Token = require('./token');
const {
  assert,
  Errors,
  throws,
} = require('../models/validator');
const User = require('../models/user');

exports.ensureAuthorization = (options = {}) => {
  const {
    strict = true,
      checkApiAccessKey = false,
  } = options;
  return async (ctx, next) => {
    if (strict && checkApiAccessKey) {
      const apiAccessKey = config.auth.apiAccessKey;
      if (apiAccessKey === ctx.headers['x-api-access-key']) {
        await next();
        return;
      }
    }
    const token = ctx.cookies.get(config.auth.tokenKey);
    if (!token && !strict) {
      await next();
      return;
    }
    assert(token, Errors.ERR_IS_REQUIRED('token'), 401);
    let decodedToken;
    try {
      const isExistInRedis = await Token.checkFromRedis(token);
      assert(isExistInRedis, Errors.ERR_AUTH_TOKEN_EXPIRED, 401);
      ctx.verification = {};
      decodedToken = Token.verify(token);
      ctx.verification.token = token;
      ctx.verification.decodedToken = decodedToken;
    } catch (err) {
      if (!strict) {
        await next();
        return;
      }
      throws(Errors.ERR_AUTH_TOKEN_EXPIRED, 401);
    }
    const {
      data: {
        userId
      }
    } = decodedToken;
    const user = await User.get(userId, {
      withProfile: true
    });
    ctx.verification.user = user;
    assert(user, Errors.ERR_NOT_FOUND('user'));
    await next();
  }
}

exports.errorHandler = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.log(err);
    if (
      err.status &&
      err.status >= httpStatus.BAD_REQUEST &&
      err.status < httpStatus.INTERNAL_SERVER_ERROR
    ) {
      ctx.throws(err);
      return;
    }
    throw err;
  }
};

exports.extendCtx = async (ctx, next) => {
  ctx.ok = data => {
    ctx.body = data;
  };
  ctx.er = (error, code) => {
    ctx.status = code || 400;
    ctx.body = error;
  };
  ctx.throws = (err) => {
    const code = err.code || Errors.ERR_INVALID_FORMAT;
    if (code === 'ERR_NOT_FOUND') {
      ctx.status = httpStatus.NOT_FOUND;
    } else if (code === 'ERR_TOO_MANY_REQUEST') {
      ctx.status = httpStatus.TOO_MANY_REQUESTS;
    } else {
      ctx.status = err.status || httpStatus.BAD_REQUEST;
    }
    ctx.body = {
      code,
      message: err.message || Errors[`${code}_MSG`]
    };
  };
  ctx.attemptRoles = (roles = []) => {
    if (!roles.includes(ctx.verification.user.accountType)) {
      ctx.throws({
        status: httpStatus.FORBIDDEN,
        code: Errors.ERR_NO_PERMISSION
      });
    }
    return ctx.verification.user.accountType;
  };
  await next();
};

exports.checkPermission = async (provider, profile) => {
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