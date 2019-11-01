const {
  assert,
  Errors
} = require('./validator');
const Vote = require('./sequelize/vote');

const OBJECT_TYPE = 'comments';

exports.create = async (userId, data) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  assert(data.objectId, Errors.ERR_IS_REQUIRED('data.objectId'));
  assert(data.type, Errors.ERR_IS_REQUIRED('data.type'));
  const payload = {
    ...data,
    userId,
    objectType: OBJECT_TYPE
  };
  await Vote.create(payload);
  return true;
};

exports.update = async (userId, objectId, data) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(objectId, Errors.ERR_IS_REQUIRED('objectId'));
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  await Vote.update(data, {
    where: {
      userId,
      objectId,
      objectType: OBJECT_TYPE
    }
  });
  return true;
};

exports.count = async (objectId, options = {}) => {
  assert(objectId, Errors.ERR_IS_REQUIRED('objectId'));
  const count = await Vote.count({
    where: {
      objectId,
      objectType: OBJECT_TYPE,
      ...options
    }
  });
  return count;
}

exports.get = async (userId, objectId) => {
  const vote = await Vote.findOne({
    where: {
      userId,
      objectId,
      objectType: OBJECT_TYPE
    }
  });
  return vote && vote.toJSON();
}

exports.isVoted = async (userId, objectId) => {
  const vote = await Vote.findOne({
    where: {
      userId,
      objectId,
      objectType: OBJECT_TYPE,
      type: 'UP'
    }
  });
  return !!vote;
}