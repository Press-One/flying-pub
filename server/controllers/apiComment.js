const config = require("../config");
const Comment = require("../models/comment");
const Post = require("../models/post");
const File = require("../models/file");
const User = require("../models/user");
const Log = require("../models/log");
const Mixin = require("../models/mixin");
const sensitiveWords = require("../utils/sensitiveWords.json");
const FastScanner = require("fastscan");
const scanner = new FastScanner(sensitiveWords);
const {
  truncate
} = require("../utils");
const {
  throws,
  assert,
  Errors
} = require("../utils/validator");
const {
  notifyCommentMention,
  notifyArticleComment
} = require("../models/notify");

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
  let offWords = Object.keys(
    scanner.hits(data.content, {
      longest: false,
    })
  );
  // 两个词的也暂时不管了，因为误伤率还是太高了 (By Junhong)
  offWords = offWords.filter(word => word.length > 2);
  console.log({
    offWords
  });
  if (offWords && offWords.length > 0) {
    throws(Errors.COMMENT_IS_INVALID());
  }
  const comment = await Comment.create(user.id, data);
  const originUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${data.objectId}?commentId=${comment.id}`;
  const post = await Post.getByRId(data.objectId);

  Log.create(user.id, `评论文章 ${originUrl}`);
  ctx.body = comment;

  (async () => {
    try {

      if (mentionsUserIds.length === 0) {
        try {
          const file = await File.getByRId(data.objectId);
          if (file) {
            const authorUser = await User.getByAddress(post.author.address);
            const isMyself = user.address === post.author.address;
            if (!isMyself) {
              await Mixin.pushToNotifyQueue({
                userId: authorUser.id,
                text: `${truncate(user.nickname)} 刚刚回复了你的文章`,
                url: originUrl
              });

              await notifyArticleComment({
                fromUserName: user.address,
                fromNickName: user.nickname,
                fromUserAvatar: user.avatar,
                fromContent: comment.content,
                originUrl,
                toUserName: authorUser.address,
                toNickName: authorUser.nickname,
                fromArticleId: file.rId,
                fromArticleTitle: file.title,
              });
            }
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
          await Mixin.pushToNotifyQueue({
            userId: mentionsUserId,
            text: `${truncate(user.nickname)} 刚刚回复了你的评论`,
            url: originUrl,
          });

          await notifyCommentMention({
            fromUserName: user.address,
            fromNickName: user.nickname,
            fromUserAvatar: user.avatar,
            fromContent: comment.content,
            originUrl,
            toUserName: mUser.address,
            toNickName: mUser.nickname,
            fromArticleId: post.rId,
            fromArticleTitle: post.title,
          });
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
  ctx.body = deletedComment;
};

exports.list = async (ctx) => {
  const {
    fileRId
  } = ctx.query;
  assert(fileRId, Errors.ERR_IS_REQUIRED("fileRId"));
  const userId = ctx.verification && ctx.verification.user.id;
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const result = await Comment.list({
    userId,
    objectId: fileRId,
    offset,
    limit,
  });
  const total = await Comment.count(fileRId);
  ctx.body = {
    total,
    comments: result,
  };
};