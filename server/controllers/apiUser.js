const Conversation = require('../models/conversation');

exports.get = async ctx => {
  const {
    user
  } = ctx.verification;
  const conversation = await Conversation.get(user.id);
  const notificationEnabled = !!conversation;
  ctx.body = {
    ...user,
    notificationEnabled
  };
};