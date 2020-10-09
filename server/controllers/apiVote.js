const config = require("../config");
const Vote = require("../models/vote");
const Post = require("../models/post");
const File = require("../models/file");
const Sync = require("../models/sync");
const Log = require("../models/log");
const Mixin = require("../models/mixin");
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
  notifyCommentLike,
  notifyArticleLike
} = require("../models/notify");

exports.create = async (ctx) => {
  const {
    user
  } = ctx.verification;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED("data"));
  assert(data.objectType, Errors.ERR_IS_REQUIRED("data.objectType"));
  assert(data.objectId, Errors.ERR_IS_REQUIRED("data.objectId"));
  const userId = user.id;
  const {
    objectType,
    objectId
  } = data;
  const isVoteExist = await Vote.isVoted(
    userId,
    objectType,
    objectId,
    "comments"
  );
  assert(!isVoteExist, Errors.ERR_IS_DUPLICATED("vote"));
  await Vote.create(userId, {
    objectType,
    objectId,
    type: data.type,
  });
  const object = await Sync.syncVote(objectType, objectId, {
    userId,
  });
  ctx.body = object;
  (async () => {
    if (objectType === "comments") {
      try {
        const comment = await Comment.get(objectId);
        const originUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${comment.objectId}?commentId=${objectId}`;

        try {
          const isMyself = user.id === comment.userId;
          if (!isMyself) {
            await Mixin.pushToNotifyQueue({
              userId: comment.userId,
              text: `你的评论收到了一个赞`,
              url: originUrl,
            });

            const commentUser = await User.get(comment.userId);
            await notifyCommentLike({
              fromUserName: user.address,
              fromNickName: user.nickname,
              fromUserAvatar: user.avatar,
              fromContent: comment.content,
              originUrl,
              toUserName: commentUser.address,
              toNickName: commentUser.nickname,
            });
          }
        } catch (err) {
          console.log(err);
        }
        Log.create(userId, `点赞评论 ${originUrl}`);
      } catch (err) {
        console.log(err);
      }
    }
    if (objectType === "posts") {
      try {
        const file = await File.getByRId(objectId);
        if (file) {
          const originUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${objectId}`;
          const post = await Post.getByRId(data.objectId);
          const authorUser = await User.getByAddress(post.author.address);
          const isMyself = user.address === post.author.address;
          if (!isMyself) {
            await Mixin.pushToNotifyQueue({
              userId: authorUser.id,
              text: `《${truncate(file.title)}》收到了一个赞`,
              url: originUrl
            });

            await notifyArticleLike({
              fromUserName: user.address,
              fromNickName: user.nickname,
              fromUserAvatar: user.avatar,
              originUrl,
              toUserName: authorUser.address,
              toNickName: authorUser.nickname,
              fromArticleId: file.rId,
              fromArticleTitle: file.title,
            });
          }
          Log.create(userId, `点赞文章 ${originUrl}`);
        }
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
  await Vote.delete(userId, objectType, objectId);
  const object = await Sync.syncVote(objectType, objectId, {
    userId,
  });
  Log.create(userId, `取消点赞 ${objectType} ${objectId}`);
  ctx.body = object;
};