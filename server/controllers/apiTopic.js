const User = require('../models/user');
const Topic = require('../models/topic');
const Post = require('../models/post');
const { appendFollowingStatus } = require('./apiSubscription');
const Author = require('../models/sequelize/author');
const TopicContributionRequest = require('../models/sequelize/topicContributionRequest');
const {
  assert,
  Errors
} = require("../utils/validator");
const _ = require('lodash');
const {
  notifyTopicNewFollower,
  notifyBeContributedToTopic,
  notifyTopicReceivedContribution,
  notifyTopicRejectedContribution
} = require("../models/notify");
const Mixin = require("../models/mixin");
const Log = require('../models/log');
const { truncate, getHost } = require('../utils');

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
  const post = await Post.getLatestByRId(data.rId, {
    raw: true
  });
  assert(post, Errors.ERR_NOT_FOUND("post"));
  await topic.addPosts(post);
  const isPostOwner = user.address === post.userAddress;
  if (isPostOwner) {
    Log.create(user.id, `向专题 ${topic.uuid} ${topic.name} 投稿 ${post.title} ${getHost()}/posts/${post.rId}`);
  } else {
    Log.create(user.id, `给专题 ${topic.uuid} ${topic.name} 收录 ${post.title} ${getHost()}/posts/${post.rId}`);
  }
  if (isPostOwner) {
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
        const originUrl = `${getHost()}/posts/${post.rId}`;
        await Mixin.pushToNotifyQueue({
          userId: topic.userId,
          text: `你的专题收到一个新的投稿`,
          url: originUrl
        });
      } catch (err) {
        console.log(err);
      }
    })();
  } else {
    (async () => {
      try {
        const post = await Post.getByRId(data.rId);
        await notifyBeContributedToTopic({
          fromUserName: user.address,
          fromNickName: user.nickname,
          fromUserAvatar: user.avatar,
          postTitle: post.title,
          postRId: post.rId,
          topicUuid: topic.uuid,
          topicName: topic.name,
          toUserName: post.author.address,
          toNickName: post.author.nickname,
        });
        const originUrl = `${getHost()}/posts/${post.rId}`;
        const authorUser = await User.getByAddress(post.author.address);
        await Mixin.pushToNotifyQueue({
          userId: authorUser.id,
          text: `你有一篇文章被收录到专题`,
          url: originUrl
        });
      } catch (err) {
        console.log(err);
      }
    })();
  }
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
  Log.create(user.id, `从专题 ${topic.uuid} ${topic.name} 移除 ${post.title} ${getHost()}/posts/${post.rId}`);
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
      const originUrl = `${getHost()}/posts/${post.rId}`;
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

exports.addContributionRequest = async ctx => {
  const user = ctx.verification && ctx.verification.user;
  const uuid = ctx.params.uuid;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED("data"));
  const topic = await Topic.get(uuid, {
    raw: true,
  });
  assert(topic, Errors.ERR_NOT_FOUND("topic"));
  const post = await Post.getLatestByRId(data.rId, {
    raw: true
  });
  assert(post, Errors.ERR_NOT_FOUND("post"));
  await TopicContributionRequest.create({
    userId: user.id,
    postRId: post.rId,
    topicUserId: topic.userId,
    topicUuid: topic.uuid,
    status: 'pending'
  });
  // TODO: 给主人发送通知
  // TODO: url 可以打开消息位置，文章被删除，或者取消投稿，要及时提醒
  ctx.body = true;
}

exports.removeContributionRequest = async ctx => {
  const user = ctx.verification && ctx.verification.user;
  const uuid = ctx.params.uuid;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED("data"));
  const topic = await Topic.get(uuid, {
    raw: true,
  });
  assert(topic, Errors.ERR_NOT_FOUND("topic"));
  const post = await Post.getLatestByRId(data.rId, {
    raw: true
  });
  assert(post, Errors.ERR_NOT_FOUND("post"));
  await TopicContributionRequest.destroy({
    where: {
      userId: user.id,
      postRId: post.rId,
      topicUserId: topic.userId,
      topicUuid: topic.uuid,
      status: 'pending'
    }
  });
  ctx.body = true;
}

exports.listContributionRequests = async ctx => {
  const user = ctx.verification && ctx.verification.user;
  const result = await TopicContributionRequest.findAndCountAll({
    where: {
      topicUserId: user.id
    },
    include: [{
      model: Post.SequelizePost,
      attributes: [],
      where: {
        deleted: false,
        invisibility: false
      }
    }, {
      model: Topic.SequelizeTopic,
      attributes: [],
      where: {
        deleted: false
      }
    }],
    order: [
      ['createdAt', 'DESC']
    ]
  });
  ctx.body = {
    total: result.count,
    requests: result.rows
  }
}

exports.approveContributionRequest = async ctx => {
  const user = ctx.verification && ctx.verification.user;
  const id = ~~ctx.params.id;
  const request = await TopicContributionRequest({
    where: {
      id,
      topicUserId: user.id
    },
    raw: true
  });
  assert(request, Errors.ERR_NOT_FOUND("request"));
  const topic = await Topic.get(request.topicUuid, {
    raw: true
  });
  assert(topic, Errors.ERR_NOT_FOUND("topic"));
  const post = await Post.getByRId(request.postRId, {
    raw: true
  });
  assert(post, Errors.ERR_NOT_FOUND("post"));
  await topic.addPosts(post);
  await TopicContributionRequest.update({
    status: 'approved'
  }, {
    where: {
      userId: user.id,
      postRId: post.rId,
      topicUserId: topic.userId,
      topicUuid: topic.uuid,
      status: 'pending'
    }
  });
  Log.create(user.id, `同意收录，给专题 ${topic.uuid} ${topic.name} 收录 ${post.title} ${getHost()}/posts/${post.rId}`);
  (async () => {
    try {
      await notifyBeContributedToTopic({
        fromUserName: user.address,
        fromNickName: user.nickname,
        fromUserAvatar: user.avatar,
        postTitle: post.title,
        postRId: post.rId,
        topicUuid: topic.uuid,
        topicName: topic.name,
        toUserName: post.author.address,
        toNickName: post.author.nickname,
      });
      const originUrl = `${getHost()}/posts/${post.rId}`;
      const authorUser = await User.getByAddress(post.author.address);
      // TODO: url 可以打开消息位置，文章被删除，或者取消投稿，要及时提醒
      await Mixin.pushToNotifyQueue({
        userId: authorUser.id,
        text: `你有一个投稿请求已审核通过`,
        url: originUrl
      });
    } catch (err) {
      console.log(err);
    }
  })();
  ctx.body = true;
}

exports.rejectContributionRequest = async ctx => {
  const user = ctx.verification && ctx.verification.user;
  const id = ~~ctx.params.id;
  const request = await TopicContributionRequest({
    where: {
      id,
      topicUserId: user.id
    },
    raw: true
  });
  assert(request, Errors.ERR_NOT_FOUND("request"));
  const topic = await Topic.get(request.topicUuid, {
    raw: true
  });
  assert(topic, Errors.ERR_NOT_FOUND("topic"));
  const post = await Post.getByRId(request.postRId, {
    raw: true
  });
  assert(post, Errors.ERR_NOT_FOUND("post"));
  await TopicContributionRequest.update({
    status: 'rejected'
  }, {
    where: {
      userId: user.id,
      postRId: post.rId,
      topicUserId: topic.userId,
      topicUuid: topic.uuid,
      status: 'pending'
    }
  });
  Log.create(user.id, `拒绝收录，给专题 ${topic.uuid} ${topic.name} 收录 ${post.title} ${getHost()}/posts/${post.rId}`);
  (async () => {
    try {
      await notifyBeContributedToTopic({
        fromUserName: user.address,
        fromNickName: user.nickname,
        fromUserAvatar: user.avatar,
        postTitle: post.title,
        postRId: post.rId,
        topicUuid: topic.uuid,
        topicName: topic.name,
        toUserName: post.author.address,
        toNickName: post.author.nickname,
      });
      const originUrl = `${getHost()}/posts/${post.rId}`;
      const authorUser = await User.getByAddress(post.author.address);
      // TODO: url 可以打开消息位置，文章被删除，或者取消投稿，要及时提醒
      await Mixin.pushToNotifyQueue({
        userId: authorUser.id,
        text: `你有一个投稿请求被拒绝了`,
        url: originUrl
      });
    } catch (err) {
      console.log(err);
    }
  })();
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
    return await Post.packPost(post, {
      withTopic: false
    });
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
  Log.create(user.id, `关注专题 ${topic.name} ${getHost()}/topics/${topic.uuid}`);
  (async () => {
    try {
      const isMyself = user.id == topic.userId;
      if (isMyself) {
        return;
      }
      const topicOwner = await User.get(topic.userId);
      await notifyTopicNewFollower({
        fromUserName: user.address,
        fromNickName: user.nickname,
        fromUserAvatar: user.avatar,
        topicUuid: topic.uuid,
        topicName: topic.name,
        toUserName: topicOwner.address,
        toNickName: topicOwner.nickname,
      });
      const originUrl = `${getHost()}/authors/${user.address}`;
      await Mixin.pushToNotifyQueue({
        userId: topicOwner.id,
        text: `${truncate(user.nickname)} 关注了你的专题`,
        url: originUrl
      });
    } catch (err) {
      console.log(err);
    }
  })();
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

exports.listFollowingTopicsByUserAddress = async ctx => {
  const currentUser = ctx.verification && ctx.verification.sequelizeUser;
  const userAddress = ctx.params.userAddress;
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const user = await User.getByAddress(userAddress, {
    raw: true
  });
  assert(user, Errors.ERR_NOT_FOUND("user"));
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
    return await Topic.pickTopic(topic, {
      currentUser
    })
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