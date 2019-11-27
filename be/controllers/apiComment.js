const config = require('../config');
const Comment = require('../models/comment');
const Log = require('../models/log');
const {
  assert,
  throws,
  Errors
} = require('../models/validator');
const SensitiveWordsDetector = require('../utils/sensitiveWordsDetector');

exports.create = async ctx => {
  const userId = ctx.verification.user.id;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  const hasInvalidWord = SensitiveWordsDetector.check(data.content);
  if (hasInvalidWord) {
    throws({
      code: 400,
      message: `包含敏感词，请修改后重新发布`
    })
  }
  const comment = await Comment.create(userId, data);
  Log.create(userId, `评论文章 ${config.serviceRoot}/posts/${data.objectId}`);
  ctx.body = comment;
}

exports.remove = async ctx => {
  const userId = ctx.verification.user.id;
  const id = ~~ctx.params.id;
  const comment = await Comment.get(id, {
    userId
  });
  assert(comment.userId === userId, Errors.ERR_NO_PERMISSION);
  const deletedComment = await Comment.delete(id);
  Log.create(userId, `删除评论 ${id}`);
  ctx.body = deletedComment;
}

exports.list = async ctx => {
  const {
    fileRId
  } = ctx.query;
  assert(fileRId, Errors.ERR_IS_REQUIRED('fileRId'));
  const userId = ctx.verification && ctx.verification.user.id;
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const result = await Comment.list({
    userId,
    objectId: fileRId,
    offset,
    limit
  });
  const total = await Comment.count(fileRId);
  ctx.body = {
    total,
    comments: result
  };
}