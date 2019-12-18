const Subscription = require('../models/subscription');
const Log = require('../models/log');

exports.get = async ctx => {
  const userId = ctx.verification && ctx.verification.user.id;
  const address = ctx.params.id;
  const subscription = await Subscription.get(userId, address);
  ctx.body = subscription;
}

exports.create = async ctx => {
  const userId = ctx.verification && ctx.verification.user.id;
  const {
    address
  } = ctx.request.body.payload;
  const subscription = await Subscription.create(userId, address);
  Log.create(userId, `关注作者 ${address}`);
  ctx.body = subscription;
}

exports.destroy = async ctx => {
  const userId = ctx.verification && ctx.verification.user.id;
  const address = ctx.params.id;
  await Subscription.destroy(userId, address);
  Log.create(userId, `取关作者 ${address}`);
  ctx.body = true;
}

exports.list = async ctx => {
  const userId = ctx.verification && ctx.verification.user.id;
  const subscriptions = await Subscription.list(userId);
  ctx.body = subscriptions;
}