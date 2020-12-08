const {
  assert,
  Errors
} = require("../utils/validator");
const Comment = require("./sequelize/comment");
const User = require("./user");
const Vote = require("./vote");
const Sync = require("./sync");
const sequelize = require('./sequelize/database');
const _ = require('lodash');

const packComment = async (comment, options = {}) => {
  const {
    userId,
    withSubComments,
    isSubComment
  } = options;
  assert(comment, Errors.ERR_NOT_FOUND("comment"));
  const commentJson = comment;
  const user = await User.get(commentJson.userId);
  commentJson.user = _.pick(user, ['id', 'nickname', 'avatar', 'address']);
  const voted = !!userId && (await Vote.isVoted(userId, "comments", comment.id));
  commentJson.voted = voted;
  delete commentJson.deleted;

  if (isSubComment && commentJson.replyId && commentJson.replyId !== commentJson.threadId) {
    const replyComment = await Comment.findOne({
      attributes: ['id', 'userId', 'threadId'],
      where: {
        id: commentJson.replyId,
        deleted: false
      },
      raw: true
    });
    if (replyComment) {
      const user = await User.get(replyComment.userId);
      replyComment.user = _.pick(user, ['nickname']);
      delete replyComment.userId;
      commentJson.replyComment = replyComment;
    }
  }

  if (withSubComments) {
    const subComments = await findAll({
      objectId: commentJson.objectId,
      threadId: comment.id
    })
    if (subComments.length) {
      commentJson.comments = await Promise.all(
        subComments.map(comment => {
          return packComment(comment, {
            userId,
            isSubComment: true
          });
        })
      );
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
    },
    raw: true
  });
  const derivedComment = await packComment(comment, {
    userId
  });
  return derivedComment;
};

exports.count = async objectId => {
  assert(objectId, Errors.ERR_IS_REQUIRED("objectId"));
  const countSql = `
    SELECT count(*) AS "count" FROM comments AS c1 
      LEFT JOIN comments AS c2 ON c1."threadId" = c2."id"
    WHERE (c2 IS NULL OR c2."deleted" = false) AND c1."objectId" = '${objectId}' AND c1."deleted" = false
  `;
  const countResult = await sequelize.query(countSql);
  return ~~countResult[0][0].count;;
};

exports.create = async (userId, data) => {
  assert(userId, Errors.ERR_IS_REQUIRED("userId"));
  assert(data, Errors.ERR_IS_REQUIRED("data"));
  const payload = {
    ...data,
    userId
  };
  const comment = await Comment.create(payload);
  const derivedComment = await packComment(comment.toJSON(), {
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

const findAll = async (options) => {
  const {
    objectId,
    threadId,
    offset = 0,
    limit = 1000
  } = options;
  const findSql = `
    SELECT c1.* FROM comments AS c1 
      LEFT JOIN comments AS c2 ON c1."threadId" = c2."id"
    WHERE (c2 IS NULL OR c2."deleted" = false) 
    AND c1."objectId" = '${objectId}' 
    AND c1."deleted" = false 
    AND c1."threadId" ${threadId ? ('= ' + threadId) : 'is null'} 
    ORDER BY c1."createdAt" ASC LIMIT ${limit} OFFSET ${offset}
  `
  const result = await sequelize.query(findSql);
  console.log({ result });
  return result[0];
}

exports.list = async options => {
  const {
    userId,
    objectId,
    includedCommentId,
    offset,
    limit
  } = options;
  const threadComments = await findAll({
    objectId,
    offset,
    limit
  })
  if (includedCommentId) {
    const includedThreadComment = threadComments.find(comment => comment.id == includedCommentId);
    if (!includedThreadComment) {
      const comment = await Comment.findOne({
        where: {
          id: includedCommentId,
          deleted: false
        }
      });
      if (comment) {
        if (comment.threadId) {
          const threadComment = await Comment.findOne({
            where: {
              id: comment.threadId,
              deleted: false,
            }
          });
          if (threadComment) {
            threadComments.push(threadComment);
          }
        } else {
          threadComments.push(comment);
        }
      }
    }
  }
  const list = await Promise.all(
    threadComments.map(comment => {
      return packComment(comment, {
        userId,
        withSubComments: true
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