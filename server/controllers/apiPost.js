const Post = require('../models/post');
const Subscription = require('../models/subscription');
const {
  assert,
  Errors,
  throws
} = require('../models/validator');

exports.get = async ctx => {
  const userId = ctx.verification && ctx.verification.user.id;
  const rId = ctx.params.id;
  const includeDeleted = ctx.query.includeDeleted;
  const post = await Post.getByRId(rId, {
    userId,
    withVoted: true,
    withContent: true,
    withPaymentUrl: true,
    ignoreDeleted: true
  });
  assert(post, Errors.ERR_NOT_FOUND('post'))
  if (post.latestRId) {
    ctx.body = {
      latestRId: post.latestRId
    }
    return;
  }
  if (!includeDeleted && post.deleted && !post.latestRId) {
    throws(Errors.ERR_POST_HAS_BEEN_DELETED, 404);
  }
  ctx.body = post;
}

exports.list = async ctx => {
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 20, 50);
  const order = ctx.query.order || 'PUB_DATE';
  const address = ctx.query.address;
  const dayRange = ctx.query.dayRange;
  const filterBan = ctx.query.filterBan;
  const query = {
    offset,
    limit,
    order,
    dropAuthor: !!address,
    dayRange,
    filterBan
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
  if (subscriptions.length === 0) {
    ctx.body = {
      posts: []
    };
    return;
  }
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

exports.update = async ctx => {
  const rId = ctx.params.id;
  const data = ctx.request.body.payload;
  console.log({
    rId,
    data
  });
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  await Post.updateByRId(rId, data);
  ctx.body = true;
}