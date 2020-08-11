const config = require('../config');
const Settings = require('../models/settings');
const Log = require('../models/log');
const {
  assert,
  Errors
} = require('../models/validator');

exports.get = async ctx => {
  const userId = ctx.verification && ctx.verification.user && ctx.verification.user.id;
  const settings = userId ? await Settings.getByUserId(userId) : {};
  const extra = {
    'notification.mixinClientId': config.provider.mixin.clientId,
    'notification.mixinId': config.provider.mixin.id
  }
  ctx.body = {
    ...config.settings,
    ...settings,
    extra
  };
};

exports.upsert = async ctx => {
  const userId = ctx.verification && ctx.verification.user.id;
  const data = ctx.request.body.payload;
  await Settings.upsert(userId, {
    data
  });
  const settings = await Settings.getByUserId(userId);
  assert(settings, Errors.ERR_NOT_FOUND('settings'));
  Log.create(userId, `保存用户设置 ${JSON.stringify(data)}`);
  ctx.body = {
    ...config.settings,
    ...settings
  };
}