const Comment = require('../models/comment');
const {
  assert,
  Errors
} = require('../models/validator');

exports.create = async ctx => {
  const userId = ctx.verification.user.id;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  const comment = await Comment.create(userId, data);
  ctx.body = comment;
}

exports.remove = async ctx => {
  const userId = ctx.verification.user.id;
  const id = ~~ctx.params.id;
  const comment = await Comment.get(id);
  assert(comment.userId === userId, Errors.ERR_NO_PERMISSION);
  const deletedComment = await Comment.delete(id);
  ctx.body = deletedComment;
}

exports.list = async ctx => {
  const {
    fileRId
  } = ctx.query;
  assert(fileRId, Errors.ERR_IS_REQUIRED('fileRId'));
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const result = await Comment.list({
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