const config = require("../config");
const Vote = require("../models/vote");
const Post = require("../models/post");
const Sync = require("../models/sync");
const Log = require("../models/log");
const Comment = require("../models/comment");
const User = require("../models/user");
const {
  truncate
} = require('../utils');
const {
  assert,
  Errors
} = require("../utils/validator");
const {
  pushToNotificationQueue,
} = require("../models/notification");
const {
  getCommentLikePayload,
  getArticleLikePayload
} = require("../models/messageSystem");

exports.create = async (ctx) => {
  const {
    user
  } = ctx.verification;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED("data"));
  assert(data.objectType, Errors.ERR_IS_REQUIRED("data.objectType"));
  assert(data.objectId, Errors.ERR_IS_REQUIRED("data.objectId"));
  const userId = user.id;
  const isVoteExist = await Vote.isVoted(
    userId,
    data.objectType,
    data.objectId
  );
  assert(!isVoteExist, Errors.ERR_IS_DUPLICATED("vote"));

  let object = null;

  if (data.objectType === 'comments') {
    object = await Comment.get(data.objectId);
    assert(object, Errors.ERR_NOT_FOUND("comment"));
  }
  if (data.objectType === 'posts') {
    object = await Post.getLatestByRId(data.objectId);
    assert(object, Errors.ERR_NOT_FOUND("post"));
    data.objectId = object.rId;
  }

  await Vote.create(userId, {
    objectType: data.objectType,
    objectId: data.objectId,
    type: data.type,
  });
  const votedObject = await Sync.syncVote(data.objectType, data.objectId, {
    userId,
  });
  ctx.body = votedObject;
  (async () => {
    if (data.objectType === "comments") {
      try {
        const comment = object;
        const originUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${comment.objectId}?commentId=${data.objectId}`;
        const mixinRedirectUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${comment.objectId}?action=OPEN_NOTIFICATION_MODAL&tab=0`;

        try {
          const isMyself = user.id === comment.userId;
          if (!isMyself) {
            const commentUser = await User.get(comment.userId);
            await pushToNotificationQueue({
              mixin: {
                userId: comment.userId,
                text: `你的评论收到了一个赞`,
                url: mixinRedirectUrl,
              },
              messageSystem: getCommentLikePayload({
                fromUserName: user.address,
                fromNickName: user.nickname,
                fromUserAvatar: user.avatar,
                fromContent: comment.content,
                originUrl,
                toUserName: commentUser.address,
                toNickName: commentUser.nickname,
              })
            })
          }
        } catch (err) {
          console.log(err);
        }
        Log.create(userId, `点赞评论 ${originUrl}`);
      } catch (err) {
        console.log(err);
      }
    }
    if (data.objectType === "posts") {
      try {
        const originUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${data.objectId}`;
        const mixinRedirectUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${data.objectId}?action=OPEN_NOTIFICATION_MODAL&tab=0`;
        const post = object;
        const authorUser = await User.getByAddress(post.author.address);
        const isMyself = user.address === post.author.address;
        if (!isMyself) {
          await pushToNotificationQueue({
            mixin: {
              userId: authorUser.id,
              text: `《${truncate(post.title)}》收到了一个赞`,
              url: mixinRedirectUrl
            },
            messageSystem: getArticleLikePayload({
              fromUserName: user.address,
              fromNickName: user.nickname,
              fromUserAvatar: user.avatar,
              originUrl,
              toUserName: authorUser.address,
              toNickName: authorUser.nickname,
              fromArticleId: post.rId,
              fromArticleTitle: post.title,
            })
          })
        }
        Log.create(userId, `点赞文章 ${originUrl}`);
      } catch (err) {
        console.log(err);
      }
    }
  })();
};

exports.delete = async (ctx) => {
  const {
    user
  } = ctx.verification;
  const userId = user.id;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED("data"));
  const {
    objectType,
    objectId
  } = data;

  if (data.objectType === 'comments') {
    const comment = await Comment.get(data.objectId);
    assert(comment, Errors.ERR_NOT_FOUND("comment"));
  }
  if (data.objectType === 'posts') {
    const post = await Post.getLatestByRId(data.objectId);
    assert(post, Errors.ERR_NOT_FOUND("post"));
    data.objectId = post.rId;
  }

  await Vote.delete(userId, objectType, objectId);
  const object = await Sync.syncVote(objectType, objectId, {
    userId,
  });
  Log.create(userId, `取消点赞 ${objectType} ${objectId}`);
  ctx.body = object;
};