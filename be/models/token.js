const config = require('../config');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuidv4');
const {
  pSetWithExpired,
  pGet,
  pDel
} = require('./cache');

const TYPE = 'AUTH_TOKEN';
const DEFAULT_EXPIRED_DAY = 365;
const HOUR_SECONDS = 60 * 60;
const DAY_SECONDS = HOUR_SECONDS * 24;
exports.HOUR_SECONDS = HOUR_SECONDS;

exports.setTokenToRedis = async (token, expiresIn) => {
  await pDel(TYPE, token);
  await pSetWithExpired(TYPE, token, true, expiresIn, true);
};

exports.create = async (data, options = {}) => {
  const {
    authType
  } = options;
  const jwtOptions = {};

  if (!options.noExpiration) {
    jwtOptions.expiresIn = ~~options.expiresIn || DEFAULT_EXPIRED_DAY * DAY_SECONDS;
  }

  const provider = options.provider || 'pub';
  const payload = {
    iat: Math.floor(Date.now() / 1000),
    jti: uuidv4(),
    data,
    authType,
    provider
  };
  const token = jwt.sign(
    payload,
    config.encryption.jwt.key,
    jwtOptions
  );

  exports.setTokenToRedis(token, jwtOptions.expiresIn);

  return token;
};

exports.verify = token => {
  const decodedToken = jwt.verify(token, config.encryption.jwt.key);
  return decodedToken;
};

exports.checkFromRedis = async token => {
  const ret = await pGet(TYPE, token);
  return ret;
};

exports.delFromRedis = async token => {
  await pDel(TYPE, token);
};