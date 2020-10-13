const Post = require('../models/post');
const Settings = require('../models/settings');
const Subscription = require('../models/subscription');
const config = require('../config');
const {
  assert,
  Errors,
  throws
} = require('../utils/validator');

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
  if (post.author && post.author.address) {
    const postCount = await Post.getPostCountByAuthor(post.author.address);
    post.author.postCount = postCount;
    if (!!userId) {
      try {
        const subscription = await Subscription.get(userId, post.author.address);
        if (subscription) {
          post.author.subscribed = true;
        }
      } catch (e) {
        post.author.subscribed = false;
      }
    }
  }
  ctx.body = post;
}

exports.list = async ctx => {
  const options = await getUserOptions(ctx);
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const order = options.order || 'PUB_DATE';
  const address = ctx.query.address;
  const dayRange = options.dayRange;
  const filterBan = ctx.query.filterBan;
  const filterSticky = ctx.query.filterSticky;
  const query = {
    offset,
    limit,
    order,
    dropAuthor: !!address,
    dayRange,
    filterBan,
    filterSticky
  };
  if (address) {
    query.addresses = [address];
  }
  const result = await Post.list(query);
  ctx.body = {
    posts: result
  };
}

const getUserOptions = async ctx => {
  const query = ctx.query;
  const options = { order: 'PUB_DATE' };
  if (query.filterBan || query.filterSticky) {
    return query;
  }
  if (query.order && query.dayRange) {
    return query;
  }
  const userId = ctx.verification && ctx.verification.user && ctx.verification.user.id;
  const userSettings = userId ? await Settings.getByUserId(userId) : {};
  const settings = { ...config.settings, ...userSettings };
  const type = settings['filter.type'];
  const popularityDisabled = !settings['filter.popularity.enabled'];
  if (popularityDisabled) {
    const validType = type === 'POPULARITY' ? 'PUB_DATE' : type;
    options.order = validType;
    return options;
  }
  if (query.order === 'POPULARITY') {
    options.order = 'POPULARITY';
    if (query.dayRange) {
      options.dayRange = query.dayRange;
    }
  } else if (query.order === 'PUB_DATE') {
    options.order = 'PUB_DATE';
  }
  if (!query.order && !query.dayRange) {
    if (type === 'POPULARITY') {
      const dayRange = settings['filter.dayRange'];
      const dayRangeOptions = settings['filter.dayRangeOptions'];
      const isValidDayRange = dayRange && dayRangeOptions.includes(dayRange);
      const validDayRange = isValidDayRange ? dayRange : dayRangeOptions[0];
      options.order = 'POPULARITY';
      options.dayRange = validDayRange;
    }
  }
  return options;
}

exports.listBySubscriptions = async ctx => {
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
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
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  await Post.updateByRId(rId, data);
  ctx.body = true;
}