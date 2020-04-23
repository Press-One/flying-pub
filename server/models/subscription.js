const Subscription = require('./sequelize/subscription');
const Author = require('./sequelize/author');
const {
  packAuthor
} = require('./author');
const {
  assert,
  Errors
} = require('../models/validator');

const packSubscription = (subscription) => {
  delete subscription.authorAddress;
  if (subscription.author) {
    subscription.author = packAuthor(subscription.author);
  }
  return subscription;
}

exports.get = async (userId, authorAddress) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(authorAddress, Errors.ERR_IS_REQUIRED('authorAddress'));
  const subscription = await Subscription.findOne({
    where: {
      userId,
      authorAddress
    }
  });
  assert(subscription, Errors.ERR_NOT_FOUND('subscription'));
  return subscription;
}

exports.create = async (userId, authorAddress) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(authorAddress, Errors.ERR_IS_REQUIRED('authorAddress'));
  const subscription = await Subscription.create({
    userId,
    authorAddress
  });
  return packSubscription(subscription.toJSON());
}

exports.destroy = async (userId, authorAddress) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(authorAddress, Errors.ERR_IS_REQUIRED('authorAddress'));
  await Subscription.destroy({
    where: {
      userId,
      authorAddress
    }
  });
  return true;
}

exports.list = async userId => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  const subscriptions = await Subscription.findAll({
    where: {
      userId
    },
    include: [{
      model: Author,
      where: {
        status: 'allow'
      }
    }]
  });
  return subscriptions.map(subscription => packSubscription(subscription.toJSON()));
}

exports.listSubscribers = async authorAddress => {
  assert(authorAddress, Errors.ERR_IS_REQUIRED('authorAddress'));
  const subscriptions = await Subscription.findAll({
    where: {
      authorAddress
    }
  });
  return subscriptions.map(subscription => packSubscription(subscription.toJSON()));
}