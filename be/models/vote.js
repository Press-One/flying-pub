const {
  assert,
  Errors
} = require('./validator');
const Vote = require('./sequelize/vote');

exports.create = async (userId, data) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  assert(data.objectType, Errors.ERR_IS_REQUIRED('data.objectType'));
  assert(data.objectId, Errors.ERR_IS_REQUIRED('data.objectId'));
  assert(data.type, Errors.ERR_IS_REQUIRED('data.type'));
  data.objectId = String(data.objectId)
  const payload = {
    ...data,
    userId
  };
  await Vote.create(payload);
  return true;
};

exports.delete = async (userId, objectType, objectId) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(objectId, Errors.ERR_IS_REQUIRED('objectId'));
  await Vote.destroy({
    where: {
      userId,
      objectId: String(objectId),
      objectType
    }
  });
  return true;
};

exports.get = async (userId, objectType, objectId) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(objectId, Errors.ERR_IS_REQUIRED('objectId'));
  assert(objectType, Errors.ERR_IS_REQUIRED('objectType'));
  const vote = await Vote.findOne({
    where: {
      userId,
      objectId: String(objectId),
      objectType
    }
  });
  return vote && vote.toJSON();
}

exports.isVoted = async (userId, objectType, objectId) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(objectId, Errors.ERR_IS_REQUIRED('objectId'));
  assert(objectType, Errors.ERR_IS_REQUIRED('objectType'));
  const vote = await Vote.findOne({
    where: {
      userId,
      objectId: String(objectId),
      objectType,
      type: 'UP'
    }
  });
  return !!vote;
}

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
  await Post.update(objectId, {
    upVotesCount
  });
  const post = await Post.getByRId(objectId, {
    userId,
    withVoted: true
  });
  assert(post, Errors.ERR_IS_REQUIRED('post'));
  return post;
}

const count = async (objectType, objectId, options = {}) => {
  assert(objectId, Errors.ERR_IS_REQUIRED('objectId'));
  assert(objectType, Errors.ERR_IS_REQUIRED('objectType'));
  const count = await Vote.count({
    where: {
      objectId: String(objectId),
      objectType,
      ...options
    }
  });
  return count;
}

const syncVote = async (objectType, objectId, options = {}) => {
  const {
    userId
  } = options;
  const upVotesCount = await count(objectType, objectId, {
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
exports.syncVote = syncVote;

exports.replaceObjectId = async (objectId, newObjectId, objectType) => {
  assert(objectId, Errors.ERR_IS_REQUIRED('objectId'));
  assert(newObjectId, Errors.ERR_IS_REQUIRED('newObjectId'));
  assert(objectType, Errors.ERR_IS_REQUIRED('objectType'));
  await Vote.update({
    objectId: newObjectId
  }, {
    where: {
      objectId,
      objectType
    }
  })
  return true;
};