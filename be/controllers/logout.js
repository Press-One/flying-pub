const Token = require('../models/token');
const Log = require('../models/log');
const config = require('../config');

exports.logout = async (ctx) => {
  const {
    user,
    token
  } = ctx.verification;
  await Token.delFromRedis(token);
  ctx.cookies.set(config.authTokenKey)
  Log.create(user.id, `登出`);
  const {
    from
  } = ctx.query;
  ctx.redirect(from);
}