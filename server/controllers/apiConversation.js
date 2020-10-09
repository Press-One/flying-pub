const Conversation = require('../models/conversation');
const Profile = require('../models/profile');
const Mixin = require('../models/mixin');
const {
  Joi,
  assert,
  Errors,
  attempt
} = require('../utils/validator');

exports.get = async ctx => {
  const providerId = ctx.params.providerId;
  const profile = await Profile.get('mixin', providerId);
  assert(profile, Errors.ERR_IS_REQUIRED('profile'));
  const conversation = await Conversation.get(profile.userId);
  assert(conversation, Errors.ERR_IS_REQUIRED('conversation'));
  ctx.body = conversation;
}

exports.notify = async ctx => {
  const data = ctx.request.body.payload;
  attempt(data, {
    providerId: Joi.string().trim(),
    text: Joi.string().trim(),
    url: Joi.string().trim()
  });
  const profile = await Profile.get('mixin', data.providerId);
  assert(profile, Errors.ERR_IS_REQUIRED('profile'));
  const conversation = await Conversation.get(profile.userId);
  assert(conversation, Errors.ERR_IS_REQUIRED('conversation'));
  await Mixin.pushToNotifyQueue({
    userId: profile.userId,
    text: data.text.slice(0, 35),
    url: data.url
  });
  ctx.body = true;
}