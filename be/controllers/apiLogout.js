const Token = require('../models/token');
const Log = require('../models/log');
const config = require('../config');

exports.logout = async (ctx) => {
  const {
    from
  } = ctx.query;
  if (!ctx.verification) {
    ctx.redirect(from);
    return;
  }
  const {
    user,
    token
  } = ctx.verification;
  await Token.delFromRedis(token);
  ctx.cookies.set(config.auth.tokenKey)
  Log.create(user.id, `登出`);
  ctx.redirect(from);
}