const config = require('../config');
const Settings = require('../models/settings');
const Log = require('../models/log');
const {
  assert,
  Errors
} = require('../utils/validator');

exports.get = async ctx => {
  const userId = ctx.verification && ctx.verification.user && ctx.verification.user.id;
  const settings = userId ? await Settings.getByUserId(userId) : {};
  const extra = {
    'notification.mixinClientId': config.provider.mixin.clientId,
    'notification.mixinId': config.provider.mixin.id,
    'messageSystem.project': config.messageSystem.project,
    'messageSystem.endpoint': config.messageSystem.url.split('/').slice(0, 3).join('/'),
    'postView.visible': config.postView && config.postView.visible,
    'search.enabled': config.search && config.search.enabled,
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
  ctx.body = {
    ...config.settings,
    ...settings
  };
}
