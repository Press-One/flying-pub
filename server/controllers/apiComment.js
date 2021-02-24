const config = require("../config");
const Comment = require("../models/comment");
const Post = require("../models/post");
const User = require("../models/user");
const Log = require("../models/log");
const Mixin = require("../models/mixin");
let scanner = null;
const {
  truncate
} = require("../utils");
const {
  assert,
  Errors
} = require("../utils/validator");
const {
  pushToNotificationQueue,
  cancelJobFromNotificationQueue
} = require("../models/notification");
const {
  getCommentMentionPayload,
  getArticleCommentPayload
} = require("../models/messageSystem");

exports.create = async (ctx) => {
  const {
    user,
  } = ctx.verification;
  const data = ctx.request.body.payload;
  const {
    options = {}
  } = data;
  const {
    mentionsUserIds = []
  } = options;
  delete data.options;
  assert(data, Errors.ERR_IS_REQUIRED("data"));
  assert(data.content, Errors.ERR_IS_REQUIRED("comment"));
  let offWords = [];
  if (process.env.NODE_ENV === 'production') {
    offWords = Object.keys(
      scanner.hits(data.content, {
        longest: false,
      })
    );
  }

  const post = await Post.getLatestByRId(data.objectId);
  assert(post, Errors.ERR_NOT_FOUND("post"));
  data.objectId = post.rId;
  if (data.replyId) {
    const replyComment = await Comment.get(data.replyId);
    assert(replyComment, Errors.ERR_NOT_FOUND("replyComment"));
  }
  const comment = await Comment.create(user.id, data);
  const originUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${data.objectId}?commentId=${comment.id}`;
  const mixinCommentRedirectUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${data.objectId}?action=OPEN_NOTIFICATION_MODAL&tab=1`;
  const mixinReplyRedirectUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${data.objectId}?action=OPEN_NOTIFICATION_MODAL&tab=2`;

  // 两个词的也暂时不管了，因为误伤率还是太高了 (By Junhong)
  offWords = offWords.filter(word => word.length > 2);
  if (offWords && offWords.length > 0) {
    Log.create(user.id, `评论包含敏感词：${offWords.join('，')} ${originUrl}`, {
      toActiveMixinUser: true
    });
  }

  Log.create(user.id, `评论文章 ${originUrl}`);
  ctx.body = comment;

  (async () => {
    try {
      if (mentionsUserIds.length === 0) {
        try {
          const authorUser = await User.getByAddress(post.author.address);
          const isMyself = user.address === post.author.address;
          if (!isMyself) {
            await pushToNotificationQueue({
              mixin: {
                userId: authorUser.id,
                text: `${truncate(user.nickname)} 刚刚回复了你的文章`,
                url: mixinCommentRedirectUrl,
              },
              messageSystem: getArticleCommentPayload({
                fromUserName: user.address,
                fromNickName: user.nickname,
                fromUserAvatar: user.avatar,
                fromContent: comment.content,
                originUrl,
                toUserName: authorUser.address,
                toNickName: authorUser.nickname,
                fromArticleId: post.rId,
                fromArticleTitle: post.title,
              })
            }, {
              jobName: `comment_${comment.id}`,
              delaySeconds: 20
            })
          }
        } catch (err) {
          console.log(err);
        }
      }

      while (mentionsUserIds.length > 0) {
        const mentionsUserId = mentionsUserIds.shift();

        const isMyself = user.id === mentionsUserId;
        if (isMyself) {
          continue;
        }

        const mUser = await User.get(mentionsUserId);
        if (mUser) {
          await pushToNotificationQueue({
            mixin: {
              userId: mentionsUserId,
              text: `${truncate(user.nickname)} 刚刚回复了你的评论`,
              url: mixinReplyRedirectUrl,
            },
            messageSystem: getCommentMentionPayload({
              fromUserName: user.address,
              fromNickName: user.nickname,
              fromUserAvatar: user.avatar,
              fromContent: comment.content,
              originUrl,
              toUserName: mUser.address,
              toNickName: mUser.nickname,
              fromArticleId: post.rId,
              fromArticleTitle: post.title,
            })
          }, {
            jobName: `comment_${comment.id}`,
            delaySeconds: 20
          })
        }

      }
    } catch (e) {
      console.log(e);
    }
  })();
};

exports.remove = async (ctx) => {
  const userId = ctx.verification.user.id;
  const id = ~~ctx.params.id;
  const comment = await Comment.get(id, {
    userId,
  });
  assert(comment.userId === userId, Errors.ERR_NO_PERMISSION);
  const deletedComment = await Comment.delete(id);
  Log.create(userId, `删除评论 ${id}`);
  (async () => {
    try {
      await cancelJobFromNotificationQueue(`comment_${id}`);
    } catch (err) {
      console.log(err);
    }
  })();
  ctx.body = deletedComment;
};

exports.stick = async (ctx) => {
  const userId = ctx.verification.user.id;
  const id = ~~ctx.params.id;
  const comment = await Comment.get(id, {
    userId,
  });
  assert(comment, Errors.ERR_NOT_FOUND('comment'));
  await Comment.update(id, {
    sticky: true
  });
  Log.create(userId, `置顶评论 ${id}`);
  ctx.body = true;
};

exports.unstick = async (ctx) => {
  const userId = ctx.verification.user.id;
  const id = ~~ctx.params.id;
  const comment = await Comment.get(id, {
    userId,
  });
  assert(comment, Errors.ERR_NOT_FOUND('comment'));
  await Comment.update(id, {
    sticky: false
  });
  Log.create(userId, `取消置顶评论 ${id}`);
  ctx.body = true;
};

exports.list = async (ctx) => {
  const {
    fileRId,
    includedCommentId
  } = ctx.query;
  assert(fileRId, Errors.ERR_IS_REQUIRED("fileRId"));
  const userId = ctx.verification && ctx.verification.user.id;
  const offset = ~~ctx.query.offset || 0;
  const limit = ~~ctx.query.limit || 10;
  const [result, total] = await Promise.all([
    Comment.list({
      userId,
      objectId: fileRId,
      includedCommentId: offset === 0 ? includedCommentId : 0,
      offset,
      limit,
    }),
    Comment.count(fileRId)
  ])
  ctx.body = {
    total,
    comments: result,
  };
};

exports.batchCommentIds = async (ctx) => {
  const ids = ctx.query.ids;
  const commentIds = await Comment.batchCommentIds(ids.split(','));
  ctx.body = commentIds;
};