const Comment = require('../models/comment');
const {
  assert,
  Errors,
  throws
} = require('../models/validator');
const SensitiveWordsDetector = require('../utils/sensitiveWordsDetector');

exports.create = async ctx => {
  const userId = ctx.verification.user.id;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  const invalidWords = SensitiveWordsDetector.check(data.content);
  if (invalidWords.length > 0) {
    throws({
      code: 400,
      message: `包含敏感词: ${invalidWords.join(',')}`
    })
  }
  const comment = await Comment.create(userId, data);
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