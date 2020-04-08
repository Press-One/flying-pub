const Vote = require('./vote');
const Post = require('./post');
const Comment = require('./comment');
const {
  assert,
  Errors
} = require('./validator');

const syncCommentVote = async (objectId, upVotesCount, options = {}) => {
  const {
    userId
  } = options;
  await Comment.update(objectId, {
    upVotesCount
  });
  const comment = await Comment.get(objectId, {
    userId
  });
  assert(comment, Errors.ERR_IS_REQUIRED('comment'));
  return comment;
}

const syncPostVote = async (objectId, upVotesCount, options = {}) => {
  const {
    userId
  } = options;
  await Post.updateByRId(objectId, {
    upVotesCount
  });
  const post = await Post.getByRId(objectId, {
    userId,
    withVoted: true
  });
  assert(post, Errors.ERR_IS_REQUIRED('post'));
  return post;
}

exports.syncVote = async (objectType, objectId, options = {}) => {
  const {
    userId
  } = options;
  const upVotesCount = await Vote.count(objectType, objectId, {
    type: 'UP'
  });
  if (objectType === 'comments') {
    const object = await syncCommentVote(objectId, upVotesCount, {
      userId
    });
    return object;
  }
  if (objectType === 'posts') {
    const object = await syncPostVote(objectId, upVotesCount, {
      userId
    });
    return object;
  }
}

exports.syncComment = async fileRId => {
  const count = await Comment.count(fileRId);
  await Post.updateByRId(fileRId, {
    commentsCount: count
  });
}