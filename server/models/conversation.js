const Conversation = require('./sequelize/conversation');
const {
  Joi,
  attempt,
} = require('../utils/validator');

const packConversation = conversation => {
  delete conversation.raw;
  return conversation;
}

const get = async userId => {
  const conversation = await Conversation.findOne({
    where: {
      userId
    }
  });
  return conversation ? packConversation(conversation.toJSON()) : null;
}
exports.get = get;

exports.tryCreateConversation = async (userId, data = {}) => {
  const conversation = await get(userId);
  if (conversation) {
    return null;
  }
  attempt(data, {
    conversationId: Joi.string().required(),
    mixinAccountId: Joi.string().required(),
    raw: Joi.string().required(),
  });
  const insertedConversation = await Conversation.create({
    userId,
    ...data
  });
  return packConversation(insertedConversation.toJSON());
}