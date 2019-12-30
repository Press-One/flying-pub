const Post = require('../models/post');
const Subscription = require('../models/subscription');
const {
  assert,
  Errors
} = require('../models/validator');

exports.get = async ctx => {
  const userId = ctx.verification && ctx.verification.user.id;
  const rId = ctx.params.id;
  const post = await Post.getByRId(rId, {
    userId,
    withVoted: true,
    withContent: true,
    withPaymentUrl: true
  });
  assert(post, Errors.ERR_NOT_FOUND('post'))
  ctx.body = post;
}

exports.list = async ctx => {
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 20, 50);
  const order = ctx.query.order || 'PUB_DATE';
  const address = ctx.query.address;
  const dayRange = ctx.query.dayRange;
  const query = {
    offset,
    limit,
    order,
    dropAuthor: !!address,
    dayRange
  };
  if (address) {
    query.addresses = [address];
  }
  const result = await Post.list(query);
  ctx.body = {
    posts: result
  };
}

exports.listBySubscriptions = async ctx => {
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 20, 50);
  const userId = ctx.verification.user.id;
  const subscriptions = await Subscription.list(userId);
  const authorAddresses = subscriptions.map(subscription => subscription.author.address);
  const posts = await Post.list({
    addresses: authorAddresses,
    offset,
    limit
  });
  ctx.body = {
    posts
  };
}