const Subscription = require('./sequelize/subscription');
const {
  assert,
  Errors
} = require('../models/validator');

exports.get = async (userId, author) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(author, Errors.ERR_IS_REQUIRED('author address'));
  const subscription = await Subscription.findOne({
    where: {
      userId,
      author
    }
  });
  assert(subscription, Errors.ERR_NOT_FOUND('subscription'));
  return subscription;
}

exports.create = async (userId, author) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(author, Errors.ERR_IS_REQUIRED('author address'));
  const subscription = await Subscription.create({
    userId,
    author
  });
  return subscription.toJSON();
}

exports.destroy = async (userId, author) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(author, Errors.ERR_IS_REQUIRED('author address'));
  await Subscription.destroy({
    where: {
      userId,
      author
    }
  });
  return true;
}

exports.list = async userId => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  const subscriptions = await Subscription.findAll({
    where: {
      userId
    }
  });
  return subscriptions.map(subscription => subscription.toJSON());
}