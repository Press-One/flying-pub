const Comment = require('../models/comment');
const Vote = require('../models/vote');
const {
  assert,
  Errors
} = require('../models/validator')

const syncVote = async (commentId, userId) => {
  const upVotesCount = await Vote.count(commentId, {
    type: 'UP'
  });
  await Comment.update(commentId, {
    upVotesCount
  });
  const comment = await Comment.get(commentId, {
    userId
  });
  assert(comment, Errors.ERR_IS_REQUIRED('comment'));
  return comment;
}

exports.create = async ctx => {
  const {
    user
  } = ctx.verification;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  assert(data.commentId, Errors.ERR_IS_REQUIRED('data.commentId'));
  const userId = user.id;
  const {
    commentId
  } = data;
  const isVoteExist = await Vote.isVoted(userId, commentId);
  assert(!isVoteExist, Errors.ERR_IS_DUPLICATED('vote'));
  await Vote.create(userId, {
    objectId: commentId,
    type: data.type
  });
  const comment = await syncVote(commentId, userId);
  ctx.body = comment;
}

exports.update = async ctx => {
  const {
    user
  } = ctx.verification;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  assert(data.commentId, Errors.ERR_IS_REQUIRED('data.commentId'));
  const userId = user.id;
  const {
    commentId
  } = data;
  await Vote.update(userId, commentId, {
    type: data.type
  });
  const comment = await syncVote(commentId, userId);
  ctx.body = comment;
}