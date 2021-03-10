const config = require('../config');
const Settings = require('../models/settings');
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
    'messageSystem.enabled': !!config.messageSystem,
    'messageSystem.project': config.messageSystem ? config.messageSystem.project : '',
    'messageSystem.endpoint': config.messageSystem ? config.messageSystem.url.split('/').slice(0, 3).join('/') : '',
    'postView.visible': config.postView && config.postView.visible,
    'search.enabled': config.search && config.search.enabled && config.search.rollout,
    'recommendation.authors.enabled': !!config.recommendation && !!config.recommendation.authors
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
