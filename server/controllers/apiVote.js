const Vote = require('../models/vote');
const Sync = require('../models/sync');
const Log = require('../models/log');
const {
  assert,
  Errors
} = require('../models/validator')

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
  const object = await Sync.syncVote(objectType, objectId, {
    userId
  });
  Log.create(userId, `点赞 ${objectType} ${objectId}`);
  ctx.body = object;
}

exports.delete = async ctx => {
  const {
    user
  } = ctx.verification;
  const userId = user.id;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  const {
    objectType,
    objectId
  } = data;
  await Vote.delete(userId, objectType, objectId);
  const object = await Sync.syncVote(objectType, objectId, {
    userId
  });
  Log.create(userId, `取消点赞 ${objectType} ${objectId}`);
  ctx.body = object;
}