const Post = require('../models/post');
const Author = require('../models/author');
const Topic = require('../models/topic');
const sequelize = require('../models/sequelize/database');
const Settings = require('../models/settings');
const config = require('../config');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const {
  assert,
  Errors,
  throws
} = require('../utils/validator');

exports.get = async ctx => {
  const userId = ctx.verification && ctx.verification.user.id;
  const rId = ctx.params.id;
  const includeDeleted = ctx.query.includeDeleted;
  const dropContent = ctx.query.dropContent || false;
  const post = await Post.getByRId(rId, {
    userId,
    withVoted: true,
    withContent: !dropContent,
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
    const { author, sequelizeAuthor } = await Author.getByAddress(post.author.address, {
      returnRaw: true,
      withUserId: true
    });
    const [
      followerCount,
      postCount
    ] = await Promise.all([
      sequelizeAuthor.countFollowers({
        where: {
          id: {
            [Op.not]: author.userId
          }
        }
      }),
      sequelizeAuthor.countPosts({
        where: {
          deleted: false,
          invisibility: false
        }
      })
    ]);    
    post.author.summary = {
      post: {
        count: postCount
      },
      follower: {
        count: followerCount
      }
    }
    if (!!userId) {
      const user = ctx.verification && ctx.verification.sequelizeUser;
      const count = await user.countFollowingAuthors({
        where: {
          address: post.author.address
        }
      });
      if (count > 0) {
        post.author.following = count > 0;
      }
    }
  }
  ctx.body = post;
}

const getListController = (listOptions = {}) => {
  return async ctx => {
    let options = ctx.query;
    if (listOptions.withUserOptions) {
      options = await getUserOptions(ctx);
      if (options.order === 'SUBSCRIPTION') {
        await exports.listBySubscriptions(ctx);
        return;
      }
    }
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
      total: result.total,
      posts: result.posts,
    };
  }
}
exports.list = getListController();

const getUserOptions = async ctx => {
  const query = ctx.query;
  const options = { order: 'PUB_DATE' };
  if (query.address || query.filterBan || query.filterSticky) {
    return query;
  }
  if (query.order && query.dayRange) {
    return query;
  }
  const userId = ctx.verification && ctx.verification.user && ctx.verification.user.id;
  const userSettings = userId ? await Settings.getByUserId(userId) : {};
  const settings = { ...config.settings, ...userSettings };
  const type = settings['filter.type'];
  if (type === 'SUBSCRIPTION') {
    return { order: 'SUBSCRIPTION' }
  }
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
  const type = ctx.query.type || 'author';
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const user = ctx.verification.sequelizeUser;
  const query = {
    offset,
    limit
  };
  assert(type, Errors.ERR_IS_REQUIRED("type"));
  let total = 0;
  let posts = [];

  if (type === 'author') {
    const followingAuthors = await user.getFollowingAuthors({
      attributes: ['address'],
      joinTableAttributes: []
    });
    const followingAuthorAddresses = followingAuthors.map(author => author.address);
    if (followingAuthorAddresses.length > 0) {
      query.addresses = followingAuthorAddresses;
      const result = await Post.list(query);
      total = result.total;
      posts = result.posts;
    }
  } else if (type === 'topic') {
    const followingTopics = await user.getFollowingTopics({
      where: {
        deleted: false
      },
      attributes: ['uuid'],
      joinTableAttributes: []
    });
    const followingTopicUuids = followingTopics.map(topics => topics.uuid);
    if (followingTopicUuids.length > 0) {

      const countSql = `
      SELECT count(DISTINCT p."rId") FROM posts_topics AS p_t 
        LEFT JOIN (
          SELECT * FROM posts AS all_p LEFT JOIN authors as a ON a.address = all_p."userAddress" WHERE a.status = 'allow' AND all_p."deleted" = false and all_p."invisibility" = false 
        ) p
        ON p."rId" = p_t."postRId"
        LEFT JOIN topics ON topics."uuid" = p_t."topicUuid" AND topics."deleted" = false 
      WHERE "topicUuid" IN (${followingTopicUuids.map(uuid => `'${uuid}'`).join(',')})`;

      const findSql = `
      SELECT DISTINCT ON ("postRId") * FROM posts_topics AS p_t 
        LEFT JOIN (
          SELECT * FROM posts AS all_p LEFT JOIN authors as a ON a.address = all_p."userAddress" WHERE a.status = 'allow' AND all_p."deleted" = false and all_p."invisibility" = false 
        ) p
        ON p."rId" = p_t."postRId" 
        LEFT JOIN topics ON topics."uuid" = p_t."topicUuid" AND topics."deleted" = false 
      WHERE "topicUuid" IN (${followingTopicUuids.map(uuid => `'${uuid}'`).join(',')}) 
      OFFSET ${offset} 
      LIMIT ${limit};`;

      const [countResult, rawPostTopics] = await Promise.all([sequelize.query(countSql), sequelize.query(findSql)])
      total = ~~countResult[0][0].count;
      const postRIds = rawPostTopics[0].map(postTopic => postTopic.postRId);
      if (postRIds.length > 0) {
        posts = await Post.listByRIds(postRIds);
      } 
    }
  }
  ctx.body = {
    total,
    posts,
  };
}

exports.listByUserSettings = async ctx => {
  const userId = ctx.verification && ctx.verification.user.id;
  if (userId) {
    const list = getListController({
      withUserOptions: true
    });
    await list(ctx);
  } else {
    const list = getListController();
    await list(ctx);
  }
}

exports.update = async ctx => {
  const rId = ctx.params.id;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  await Post.updateByRId(rId, data);
  ctx.body = true;
}

exports.listTopics = async ctx => {
  const currentUser = ctx.verification && ctx.verification.sequelizeUser;
  const rId = ctx.params.id;
  const post = await Post.getByRId(rId, {
    raw: true
  });
  assert(post, Errors.ERR_NOT_FOUND('post'));
  const topics = await post.getTopics({
    where: {
      deleted: false,
    },
    ...Topic.getTopicOrderQuery(),
    joinTableAttributes: []
  });
  const derivedTopics = await Promise.all(topics.map(async topic => {
    return await Topic.pickTopic(topic, {
      currentUser
    });
  }));
  ctx.body = {
    total: derivedTopics.length,
    topics: derivedTopics
  }
}