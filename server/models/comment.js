const {
  assert,
  Errors
} = require("../utils/validator");
const Comment = require("./sequelize/comment");
const User = require("./user");
const Vote = require("./vote");
const Sync = require("./sync");
const _ = require('lodash');

const packComment = async (comment, options = {}) => {
  const {
    userId
  } = options;
  assert(comment, Errors.ERR_NOT_FOUND("comment"));
  const commentJson = comment.toJSON();
  const user = await User.get(commentJson.userId);
  commentJson.user = _.pick(user, ['id', 'nickname', 'avatar', 'address']);
  const voted = !!userId && (await Vote.isVoted(userId, "comments", comment.id));
  commentJson.voted = voted;
  delete commentJson.deleted;
  if (comment.replyId) {
    const replyComment = await Comment.findOne({
      where: {
        id: comment.replyId,
        deleted: false
      }
    });
    if (replyComment) {
      const user = await User.get(replyComment.userId);
      const replyCommentJson = replyComment.toJSON();
      replyCommentJson.user = _.pick(user, ['nickname']);
      commentJson.replyComment = replyCommentJson;
    }
  }
  return commentJson;
};

exports.batchCommentIds = async ids => {
  assert(ids, Errors.ERR_IS_REQUIRED("ids"));
  const comments = await Comment.findAll({
    attributes: ['id'],
    where: {
      id: ids,
      deleted: false
    }
  });
  return comments.map(comment => comment.id);
};

exports.get = async (id, options = {}) => {
  const {
    userId
  } = options;
  assert(id, Errors.ERR_IS_REQUIRED("id"));
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

exports.count = async objectId => {
  assert(objectId, Errors.ERR_IS_REQUIRED("objectId"));
  const count = await Comment.count({
    where: {
      objectId,
      deleted: false
    }
  });
  return count;
};

exports.create = async (userId, data) => {
  assert(userId, Errors.ERR_IS_REQUIRED("userId"));
  assert(data, Errors.ERR_IS_REQUIRED("data"));
  const payload = {
    ...data,
    userId
  };
  const comment = await Comment.create(payload);
  const derivedComment = await packComment(comment, {
    userId
  });
  const fileRId = derivedComment.objectId;
  await Sync.syncComment(fileRId);
  return derivedComment;
};

exports.update = async (id, data) => {
  assert(id, Errors.ERR_IS_REQUIRED("commentId"));
  assert(data, Errors.ERR_IS_REQUIRED("data"));
  await Comment.update(data, {
    where: {
      id
    }
  });
  return true;
};

exports.delete = async id => {
  assert(id, Errors.ERR_IS_REQUIRED("id"));
  const derivedComment = await exports.get(id);
  const fileRId = derivedComment.objectId;
  await Comment.update({
    deleted: true
  }, {
    where: {
      id
    }
  });
  await Sync.syncComment(fileRId);
  return true;
};

exports.list = async options => {
  const {
    userId,
    objectId,
    offset,
    limit
  } = options;
  const comments = await Comment.findAll({
    where: {
      objectId,
      deleted: false
    },
    offset,
    limit,
    order: [
      ["createdAt", "ASC"]
    ]
  });
  const list = await Promise.all(
    comments.map(comment => {
      return packComment(comment, {
        userId
      });
    })
  );
  return list;
};

exports.replaceObjectId = async (objectId, newObjectId) => {
  assert(objectId, Errors.ERR_IS_REQUIRED('objectId'));
  assert(newObjectId, Errors.ERR_IS_REQUIRED('newObjectId'));
  await Comment.update({
    objectId: newObjectId
  }, {
    where: {
      objectId
    }
  })
  return true;
};