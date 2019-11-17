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

exports.count = async (objectType, objectId, options = {}) => {
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