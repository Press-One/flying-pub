const Comment = require('../models/comment');
const Post = require('../models/post');
const Vote = require('../models/vote');
const {
  assert,
  Errors
} = require('../models/validator')

const syncCommentVote = async (objectId, upVotesCount, userId) => {
  await Comment.update(objectId, {
    upVotesCount
  });
  const comment = await Comment.get(objectId, {
    userId
  });
  assert(comment, Errors.ERR_IS_REQUIRED('comment'));
  return comment;
}

const syncPostVote = async (objectId, upVotesCount, userId) => {
  await Post.upsert(objectId, {
    upVotesCount
  });
  const post = await Post.get(objectId, {
    userId
  });
  assert(post, Errors.ERR_IS_REQUIRED('post'));
  return post;
}

const syncVote = async (objectType, objectId, userId) => {
  const upVotesCount = await Vote.count(objectType, objectId, {
    type: 'UP'
  });
  if (objectType === 'comments') {
    const object = await syncCommentVote(objectId, upVotesCount, userId);
    return object;
  }
  if (objectType === 'posts') {
    const object = await syncPostVote(objectId, upVotesCount, userId);
    return object;
  }
}

exports.create = async ctx => {
  const {
    user
  } = ctx.verification;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  assert(data.objectType, Errors.ERR_IS_REQUIRED('data.objectType'));
  assert(data.objectId, Errors.ERR_IS_REQUIRED('data.objectId'));
  const userId = user.id;
  const {
    objectType,
    objectId
  } = data;
  const isVoteExist = await Vote.isVoted(userId, objectType, objectId, 'comments');
  assert(!isVoteExist, Errors.ERR_IS_DUPLICATED('vote'));
  await Vote.create(userId, {
    objectType,
    objectId,
    type: data.type
  });
  const comment = await syncVote(objectType, objectId, userId);
  ctx.body = comment;
}

exports.update = async ctx => {
  const {
    user
  } = ctx.verification;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  assert(data.objectType, Errors.ERR_IS_REQUIRED('data.objectType'));
  assert(data.objectId, Errors.ERR_IS_REQUIRED('data.objectId'));
  const userId = user.id;
  const {
    objectType,
    objectId
  } = data;
  await Vote.update(userId, objectType, objectId, {
    type: data.type
  });
  const comment = await syncVote(objectType, objectId, userId);
  ctx.body = comment;
}