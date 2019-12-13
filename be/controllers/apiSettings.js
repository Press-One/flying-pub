const Settings = require('../models/settings');
const Log = require('../models/log');
const {
  assert,
  Errors
} = require('../models/validator');

exports.get = async ctx => {
  const {
    user
  } = ctx.verification;
  const userId = user.id;
  const settings = await Settings.getByUserId(userId);
  assert(settings, Errors.ERR_NOT_FOUND('settings'));
  ctx.body = settings;
};

exports.upsert = async ctx => {
  const {
    user
  } = ctx.verification;
  const userId = user.id;
  const data = ctx.request.body.payload;
  await Settings.upsert(userId, {
    data
  });
  const settings = await Settings.getByUserId(userId);
  assert(settings, Errors.ERR_NOT_FOUND('settings'));
  Log.create(userId, `保存用户设置 ${JSON.stringify(data)}`);
  ctx.body = settings;
}