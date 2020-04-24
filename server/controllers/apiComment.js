const config = require('../config');
const Comment = require('../models/comment');
const Log = require('../models/log');
const request = require('request-promise');
const Mixin = require('../models/mixin');
const {
  assert,
  Errors
} = require('../models/validator');

exports.create = async ctx => {
  const userId = ctx.verification.user.id;
  const userName = ctx.verification.user.name;
  const data = ctx.request.body.payload;
  const {
    options = {}
  } = data;
  const {
    mentionsUserIds = []
  } = options;
  delete data.options;
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  const comment = await Comment.create(userId, data);
  const postPath = `/posts/${data.objectId}?commentId=${comment.id}`;
  try {
    await request({
      uri: `${config.settings['pub.site.url']}/api/notify`,
      method: 'POST',
      json: true,
      body: {
        payload: {
          rId: data.objectId,
          commentUser: userName,
          redirect: postPath
        }
      }
    }).promise();
    while (mentionsUserIds.length > 0) {
      const mentionsUserId = mentionsUserIds.shift();
      await Mixin.pushToNotifyQueue({
        userId: mentionsUserId,
        text: `${userName}回复了你的评论`,
        url: `${config.serviceRoot}${postPath}`
      });
    }
  } catch (e) {
    console.log(e);
  }
  Log.create(userId, `评论文章 ${config.serviceRoot}/posts/${data.objectId}`);
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
  Log.create(userId, `删除评论 ${id}`);
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