const Cache = require('../models/cache');
const config = require('../config');
const {
  assert,
  Errors
} = require('../models/validator');

const type = `${config.serviceName}_AUTO_LOGIN`;
const key = 'URL';

exports.get = async (ctx) => {
  const url = await Cache.pGet(type, key);
  ctx.body = {
    url: url || null
  };
}

exports.create = async (ctx) => {
  const {
    url
  } = ctx.request.body.payload;
  assert(url, Errors.ERR_IS_REQUIRED('url'));
  await Cache.pSetWithExpired(type, key, url, 20, true);
  ctx.body = true;
}

exports.del = async (ctx) => {
  await Cache.pDel(type, key);
  ctx.body = true;
}