const config = require('../config');
const Cache = require('../models/cache');
const Post = require('../models/post');
const Sequelize = require('sequelize');
const _ = require('lodash');
const Op = Sequelize.Op;
const moment = require('moment');
const {
  assert,
  Errors,
} = require('../utils/validator');

const TYPE = 'VIEW';
const IP_EXPIRED_DURATION = config.postView && config.postView.ipExpiredDuration > 0 ? config.postView.ipExpiredDuration : 60 * 60;

const getCountKey = postRId => `count:${postRId}`;

exports.getCountByRId = async postRId => {
  const countKey = getCountKey(postRId);
  const count = await Cache.pGet(TYPE, countKey);
  return count ? ~~count : 0;
}

const trySave = async (ip, postRId, postViewCount = 0) => {
  try {
    assert(ip, Errors.ERR_IS_REQUIRED('ip'));
    assert(postRId, Errors.ERR_IS_REQUIRED('postRId'));
    const ipKey = `view:${postRId}:${ip}`
    const countKey = getCountKey(postRId);
    const existOne = await Cache.pGet(TYPE, ipKey);
    let cachedCount = await Cache.pGet(TYPE, countKey) || 0;
    cachedCount = ~~cachedCount || postViewCount;
    if (!existOne) {
      await Cache.pSetWithExpired(TYPE, ipKey, '1', IP_EXPIRED_DURATION, true);
      cachedCount++;
      await Cache.pSet(TYPE, countKey, `${cachedCount}`);
    }
    return cachedCount;
  } catch (err) {
    console.log(err);
  }
}
exports.trySave = trySave;

exports.sync = async () => {
  try {
    const keys = await Cache.pFindKeys(TYPE, `count:*`);
    for (const key of keys) {
      const countKey = key.replace(Cache.getPrefix() + TYPE + '_', '');
      let count = await Cache.pGet(TYPE, countKey);
      count = ~~count;
      if (count > 0) {
        const postRId = countKey.split(':')[1];
        const post = await Post.SequelizePost.findOne({
          attributes: ['viewCount'],
          where: {
            rId: postRId
          },
          raw: true
        });
        assert(post, Errors.ERR_IS_REQUIRED('post'));
        if (~~post.viewCount < count) {
          await Post.updateByRId(postRId, {
            viewCount: count
          });
        }
        await Cache.pDel(TYPE, countKey);
      }
    }
  } catch (err) {
    console.log(err);
  }
}

// 平均每篇文章每天贡献 n 个阅读量
exports.addAvgView = async () => {
  try {
    const TYPE = 'AVG_VIEW_ADDING';
    const today = moment().format('YYYY-MM-DD');
    const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const TODAY_COUNT_KEY = `${today}_COUNT`;
    const YESTERDAY_COUNT_KEY = `${yesterday}_COUNT`;
    const count = ~~(await Cache.pGet(TYPE, TODAY_COUNT_KEY) || 0);
    const allVisiblePostCount = await Post.SequelizePost.count({
      where: {
        latestRId: null,
        deleted: false,
        invisibility: false
      }
    });
    if (count >= allVisiblePostCount) {
      return;
    }
    console.log(`【addAvgView】还需要 ${allVisiblePostCount - count - 1} 次`);
    const posts = await Promise.all(Array(config.postView.avgPerCount).fill(0).map(async () => {
      const offset = _.random(0, allVisiblePostCount - 1);
      const post = await Post.SequelizePost.findOne({
        attributes: ['rId', 'viewCount', 'title'],
        where: {
          latestRId: null,
          deleted: false,
          invisibility: false
        },
        offset,
        raw: true
      });
      return post;
    }))
    if (posts.length === 0) {
      console.log(`【addAvgView】没有找到文章`);
      return;
    }
    for (const post of posts) {
      console.log({ 'post.title': post.title });
      await trySave(`0.0.0.${count}`, post.rId, ~~post.viewCount);
    }
    if ((count + 1) === allVisiblePostCount) {
      await Cache.pDel(TYPE, YESTERDAY_COUNT_KEY);
    }
    await Cache.pSet(TYPE, TODAY_COUNT_KEY, count + 1);
  } catch (err) {
    console.log({ err });
  }
}

const addHotViewToPosts = async (posts, orderConfig = {}) => {
  try {
    if (!orderConfig.maxCount) {
      return;
    }
    const TYPE = 'HOT_VIEW_ADDING';
    const today = moment().format('YYYY-MM-DD');
    const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const TODAY_COUNT_KEY = `${today}_${orderConfig.key}_COUNT`;
    const YESTERDAY_COUNT_KEY = `${yesterday}_${orderConfig.key}_COUNT`;
    const count = ~~(await Cache.pGet(TYPE, TODAY_COUNT_KEY)) || 0;
    if (count >= orderConfig.maxCount) {
      return;
    }
    console.log(`【addHotView】${orderConfig.key} 还需要 ${orderConfig.maxCount - count - 1} 次`);
    const pickedPosts = _.shuffle(posts).slice(0, orderConfig.perPostCount || 1);
    for (const post of pickedPosts) {
      console.log({ 'post.title': post.title });
      await trySave(`0.0.0.${_.random(10000)}`, post.rId, ~~post.viewCount);
    }
    if ((count + 1) === orderConfig.maxCount) {
      await Cache.pDel(TYPE, YESTERDAY_COUNT_KEY);
    }
    await Cache.pSet(TYPE, TODAY_COUNT_KEY, count + 1);
  } catch (err) {
    console.log(err);
  }
}

exports.addViewAfterPublishNewPost = async () => {
  try {
    if (!config.postView.viewCountAfterPublishNewPost) {
      return;
    }
    const TYPE = 'PUBLISH_VIEW_ADDING';
    const KEY = 'ALL_VISIBLE_POST_COUNT';
    const count = ~~(await Cache.pGet(TYPE, KEY) || 0);
    const allVisiblePostCount = await Post.SequelizePost.count({
      where: {
        latestRId: null,
        deleted: false,
        invisibility: false
      }
    });
    if (allVisiblePostCount > count) {
      console.log(`【addViewAfterPublishNewPost】有新的文章发布了`);
      const { posts: pubDatePosts } = await Post.list({
        offset: 1,
        limit: config.postView.viewPostCountAfterPublishNewPost || 6,
        order: 'PUB_DATE',
        dropAuthor: false,
        dayRange: null,
      });
      let counter = 0;
      while (counter < config.postView.viewCountAfterPublishNewPost) {
        try {
          const randomPost = pubDatePosts[_.random(0, pubDatePosts.length - 1)]
          console.log({ 'post.title': randomPost.title });
          await trySave(`0.0.0.${_.random(10000)}`, randomPost.rId, ~~randomPost.viewCount);
        } catch (err) {
          console.log(err);
        }
        counter++;
      }
      await Cache.pSet(TYPE, KEY, `${allVisiblePostCount}`);
      return;
    }
  } catch (err) {
    console.log(err);
  }
}

exports.addHotView = async () => {
  try {
    // 最新评论（待定）
    // 最新
    const { posts: pubDatePosts } = await Post.list({
      offset: 0,
      limit: config.postView.order.pubDate.rangeLimit,
      order: 'PUB_DATE',
      dropAuthor: false,
      dayRange: null,
    });
    await addHotViewToPosts(pubDatePosts, config.postView.order.pubDate);
    // 热门 7
    const { posts: popularity7Posts } = await Post.list({
      offset: 0,
      limit: config.postView.order.popularity_7.rangeLimit,
      order: 'POPULARITY',
      dropAuthor: false,
      dayRange: 7,
    });
    await addHotViewToPosts(popularity7Posts, config.postView.order.popularity_7);
    // 热门 30
    const { posts: popularity30Posts } = await Post.list({
      offset: 0,
      limit: config.postView.order.popularity_30.rangeLimit,
      order: 'POPULARITY',
      dropAuthor: false,
      dayRange: 30,
    });
    await addHotViewToPosts(popularity30Posts, config.postView.order.popularity_30);
    // 热门 全部
    const { posts: popularity0Posts } = await Post.list({
      offset: 0,
      limit: config.postView.order.popularity_0.rangeLimit,
      order: 'POPULARITY',
      dropAuthor: false,
      dayRange: 0,
    });
    await addHotViewToPosts(popularity0Posts, config.postView.order.popularity_0);
    // 置顶
    const { posts: stickyPosts } = await Post.list({
      offset: 0,
      limit: config.postView.order.sticky.rangeLimit,
      dropAuthor: false,
      filterSticky: true
    });
    await addHotViewToPosts(stickyPosts, config.postView.order.sticky);
  } catch (err) {
    console.log({ err });
  }
}
