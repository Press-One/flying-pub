const {
  assert,
  Errors
} = require('./validator');
const Comment = require('./sequelize/comment');
const User = require('./user');
const Post = require('./post');
const Vote = require('./vote');

const packComment = async (comment, options = {}) => {
  const {
    userId
  } = options;
  assert(comment, Errors.ERR_NOT_FOUND('comment'));
  const commentJson = comment.toJSON();
  const user = await User.get(commentJson.userId, {
    withProfile: true
  });
  commentJson.user = user;
  const voted = !!userId && await Vote.isVoted(userId, 'comments', comment.id);
  commentJson.voted = voted;
  delete commentJson.deleted;
  return commentJson;
}

exports.get = async (id, options = {}) => {
  const {
    userId
  } = options;
  assert(id, Errors.ERR_IS_REQUIRED('id'));
  const comment = await Comment.findOne({
    where: {
      id,
      deleted: false
    }
  });
  const derivedComment = await packComment(comment, {
    userId
  });
  return derivedComment;
};

exports.create = async (userId, data) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  const payload = {
    ...data,
    userId,
  };
  const comment = await Comment.create(payload);
  const derivedComment = await packComment(comment, {
    userId
  });
  const fileRId = derivedComment.objectId;
  const count = await exports.count(fileRId);
  await Post.upsert(fileRId, {
    commentsCount: count,
  });
  return derivedComment;
};

exports.update = async (id, data) => {
  assert(id, Errors.ERR_IS_REQUIRED('commentId'));
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  await Comment.update(data, {
    where: {
      id
    }
  })
  return true;
};

exports.delete = async id => {
  assert(id, Errors.ERR_IS_REQUIRED('id'));
  const derivedComment = await exports.get(id);
  const fileRId = derivedComment.objectId;
  await Comment.update({
    deleted: true
  }, {
    where: {
      id
    }
  });
  const count = await exports.count(fileRId);
  await Post.upsert(fileRId, {
    commentsCount: count,
  });
  return true;
};

exports.count = async (objectId) => {
  assert(objectId, Errors.ERR_IS_REQUIRED('objectId'));
  const count = await Comment.count({
    where: {
      objectId,
      deleted: false,
    },
  });
  return count;
};

exports.list = async (options) => {
  const {
    userId,
    objectId,
    offset,
    limit,
  } = options;
  const comments = await Comment.findAll({
    where: {
      objectId,
      deleted: false,
    },
    offset,
    limit,
    // order: [
    //   ['upVotesCount', 'DESC']
    // ]
  });
  const list = await Promise.all(
    comments.map((comment) => {
      return packComment(comment, {
        userId
      });
    })
  )
  return list;
};