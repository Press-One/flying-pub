const config = require("../config");
const User = require('../models/user');
const Topic = require('../models/topic');
const Post = require('../models/post');
const { appendFollowingStatus } = require('./apiSubscription');
const Author = require('../models/sequelize/author');
const {
  assert,
  Errors
} = require("../utils/validator");
const _ = require('lodash');
const {
  notifyTopicReceivedContribution,
  notifyTopicRejectedContribution
} = require("../models/notify");
const Mixin = require("../models/mixin");
const Log = require('../models/log');

exports.get = async ctx => {
  const currentUser = ctx.verification && ctx.verification.sequelizeUser;
  const uuid = ctx.params.uuid;
  const topic = await Topic.get(uuid, {
    currentUser,
    withAuthor: true,
    summaryPreviewCount: 3
  });
  assert(topic, Errors.ERR_NOT_FOUND("topic"));
  ctx.body = topic;
}

exports.create = async ctx => {
  const user = ctx.verification.sequelizeUser;
  const data = ctx.request.body.payload;
  const topic = await Topic.create(user, data);
  Log.create(user.id, `创建专题 ${topic.uuid} ${topic.name}`);
  ctx.body = topic;
}

exports.update = async ctx => {
  const user = ctx.verification.sequelizeUser;
  const uuid = ctx.params.uuid;
  const data = ctx.request.body.payload;
  await Topic.update(user, uuid, data);
  const topic = await Topic.get(uuid);
  Log.create(user.id, `更新专题 ${topic.uuid} ${topic.name}`);
  ctx.body = topic;
}

exports.remove = async ctx => {
  const user = ctx.verification.sequelizeUser;
  const uuid = ctx.params.uuid;
  const topic = await Topic.get(uuid);
  assert(topic, Errors.ERR_NOT_FOUND("topic"));
  await Topic.remove(user, uuid);
  Log.create(user.id, `删除专题 ${topic.uuid} ${topic.name}`);
  ctx.body = true;
}

exports.listByUserAddress = async ctx => {
  const currentUser = ctx.verification && ctx.verification.sequelizeUser;
  const userAddress = ctx.params.userAddress;
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const user = await User.getByAddress(userAddress, {
    raw: true
  });
  assert(user, Errors.ERR_NOT_FOUND("user"));
  const total = await user.countTopics({
    where: {
      deleted: false
    }
  });
  const topics = await user.getTopics({
    where: {
      deleted: false,
    },
    ...Topic.getTopicOrderQuery(),
    offset,
    limit
  });

  const derivedTopics = await Promise.all(topics.map(async topic => {
    return await Topic.pickTopic(topic, {
      currentUser
    })
  }));

  ctx.body = {
    total,
    topics: derivedTopics,
  };
}

exports.addContribution = async ctx => {
  const user = ctx.verification && ctx.verification.user;
  const uuid = ctx.params.uuid;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED("data"));
  const topic = await Topic.get(uuid, {
    raw: true,
  });
  assert(topic, Errors.ERR_NOT_FOUND("topic"));
  const post = await Post.getByRId(data.rId, {
    raw: true
  });
  assert(post, Errors.ERR_NOT_FOUND("post"));
  await topic.addPosts(post);
  Log.create(user.id, `向专题 ${topic.uuid} ${topic.name} 投稿 ${post.rId} ${post.title}`);
  (async () => {
    try {
      const isMyself = user.id == topic.userId;
      const post = await Post.getByRId(data.rId);
      if (isMyself) {
        return;
      }
      const topicOwner = await User.get(topic.userId);
      await notifyTopicReceivedContribution({
        fromUserName: user.address,
        fromNickName: user.nickname,
        fromUserAvatar: user.avatar,
        postTitle: post.title,
        postRId: post.rId,
        topicUuid: topic.uuid,
        topicName: topic.name,
        toUserName: topicOwner.address,
        toNickName: topicOwner.nickname,
      });
      const originUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${post.rId}`;
      await Mixin.pushToNotifyQueue({
        userId: topic.userId,
        text: `你的专题收到一个新的投稿`,
        url: originUrl
      });
    } catch (err) {
      console.log(err);
    }
  })();
  ctx.body = true;
}

exports.removeContribution = async ctx => {
  const user = ctx.verification && ctx.verification.user;
  const uuid = ctx.params.uuid;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED("data"));
  const topic = await Topic.get(uuid, {
    raw: true
  });
  assert(topic, Errors.ERR_NOT_FOUND("topic"));
  const post = await Post.getByRId(data.rId, {
    raw: true
  });
  assert(post, Errors.ERR_NOT_FOUND("post"));
  await topic.removePosts(post);
  Log.create(user.id, `从专题 ${topic.uuid} ${topic.name} 移除 ${post.rId} ${post.title}`);
  (async () => {
    try {
      const post = await Post.getByRId(data.rId);
      const isMyself = user.address === post.author.address;
      if (isMyself) {
        return;
      }
      Log.create(user.id, `移除理由：${data.note || ''}`);
      await notifyTopicRejectedContribution({
        fromUserName: user.address,
        fromNickName: user.nickname,
        fromUserAvatar: user.avatar,
        postTitle: post.title,
        postRId: post.rId,
        topicUuid: topic.uuid,
        topicName: topic.name,
        note: data.note,
        toUserName: post.author.address,
        toNickName: post.author.nickname,
      });
      const originUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${post.rId}`;
      const authorUser = await User.getByAddress(post.author.address);
      await Mixin.pushToNotifyQueue({
        userId: authorUser.id,
        text: `你有一篇文章被专题创建者移除`,
        url: originUrl
      });
    } catch (err) {
      console.log(err);
    }
  })();
  ctx.body = true;
}

exports.listTopicPosts = async ctx => {
  const uuid = ctx.params.uuid;
  const order = ctx.query.order || 'PUB_DATE';
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const topic = await Topic.get(uuid, {
    raw: true
  });
  assert(topic, Errors.ERR_NOT_FOUND("topic"));
  const where = {
    deleted: false,
    invisibility: false
  };
  const total = await topic.countPosts({
    where
  });
  const posts = await topic.getPosts({
    where,
    joinTableAttributes: [],
    offset,
    limit,
    include: [{
      model: Author,
      where: {
        status: 'allow'
      }
    }],
    order: [Post.getOrder(order)]
  });
  const derivedPosts = await Promise.all(posts.map(async post => {
    return await Post.packPost(post.toJSON());
  }))
  ctx.body = {
    total,
    posts: derivedPosts
  }
}

exports.addFollower = async ctx => {
  const user = ctx.verification.sequelizeUser;
  const uuid = ctx.params.uuid;
  const topic = await Topic.get(uuid, {
    raw: true
  });
  assert(topic, Errors.ERR_NOT_FOUND('topic'));
  await topic.addFollowers(user);
  Log.create(user.id, `关注专题 ${topic.uuid} ${topic.name}`);
  ctx.body = true;
}

exports.removeFollower = async ctx => {
  const user = ctx.verification.sequelizeUser;
  const uuid = ctx.params.uuid;
  const topic = await Topic.get(uuid, {
    raw: true
  });
  assert(topic, Errors.ERR_NOT_FOUND('topic'));
  await topic.removeFollowers(user);
  Log.create(user.id, `取消关注专题 ${topic.uuid} ${topic.name}`);
  ctx.body = true;
}

exports.listFollowers = async ctx => {
  const user = ctx.verification && ctx.verification.sequelizeUser;
  const uuid = ctx.params.uuid;
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const topic = await Topic.get(uuid, {
    raw: true
  });
  assert(topic, Errors.ERR_NOT_FOUND('topic'));
  const [ total, users ] = await Promise.all([
    topic.countFollowers(),
    topic.getFollowers({
      joinTableAttributes: [],
      offset,
      limit
    })
  ]);
  
  let derivedAuthors = await Promise.all(users.map(async user => {
    const derivedUser = await User.packUser(user.toJSON());
    return _.pick(derivedUser, ['address', 'nickname', 'avatar', 'cover', 'bio'])
  }));

  if (user && derivedAuthors.length > 0) {
    derivedAuthors = await appendFollowingStatus(derivedAuthors, user);
  }

  ctx.body = {
    total,
    authors: derivedAuthors
  };
}

exports.listFollowingTopics = async ctx => {
  const user = ctx.verification && ctx.verification.sequelizeUser;
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const where = {
    deleted: false
  };
  const [total, topics] = await Promise.all([
    user.countFollowingTopics({
      where,
    }),
    user.getFollowingTopics({
      where,
      joinTableAttributes: [],
      ...Topic.getTopicOrderQuery(),
      offset,
      limit,
    })
  ]);
  const derivedTopics = await Promise.all(topics.map(async topic => {
    const derivedTopic = await Topic.pickTopic(topic);
    derivedTopic.following = true;
    return derivedTopic;
  }));

  ctx.body = {
    total,
    topics: derivedTopics,
  };
}

exports.listAuthors = async ctx => {
  const user = ctx.verification && ctx.verification.sequelizeUser;
  const uuid = ctx.params.uuid;
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const authors = await Topic.listAuthors(uuid, {
    offset,
    limit
  });
  let derivedTopics = authors;

  if (user && derivedTopics.length > 0) {
    derivedTopics = await appendFollowingStatus(derivedTopics, user);
  }

  ctx.body = {
    total: derivedTopics.length,
    authors: derivedTopics,
  };
}

exports.getPublicTopics = async ctx => {
  const currentUser = ctx.verification && ctx.verification.sequelizeUser;
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const result = await Topic.listPublicTopics({
    currentUser,
    offset,
    limit
  });
  ctx.body = result
}