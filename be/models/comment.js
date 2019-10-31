const {
  assert,
  Errors
} = require('./validator');
const Comment = require('./sequelize/comment');
const User = require('./user');
const Post = require('./post');

const packComment = async (comment) => {
  assert(comment, Errors.ERR_NOT_FOUND('comment'));
  const commentJson = comment.toJSON();
  const {
    userId
  } = commentJson;
  const user = await User.get(userId, {
    withProfile: true
  });
  commentJson.user = user;
  delete commentJson.deleted;
  return commentJson;
}

exports.get = async id => {
  assert(id, Errors.ERR_IS_REQUIRED('id'));
  const comment = await Comment.findOne({
    where: {
      id,
      deleted: false
    }
  });
  const derivedComment = await packComment(comment);
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
  const derivedComment = await packComment(comment);
  const fileRId = derivedComment.objectId;
  const count = await exports.count(fileRId);
  await Post.upsert(fileRId, {
    commentsCount: count,
  });
  return derivedComment;
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
    limit
  });
  const list = await Promise.all(
    comments.map((comment) => {
      return packComment(comment);
    })
  )
  return list;
};