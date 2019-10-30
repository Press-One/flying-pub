const Reward = require('./sequelize/reward');
const Joi = require('joi');
const {
  assert,
  Errors,
  attempt
} = require('../models/validator');

const get = async fileRId => {
  assert(fileRId, Errors.ERR_IS_REQUIRED('fileRId'))
  const reward = await Reward.findOne({
    where: {
      fileRId
    }
  });
  return reward ? reward.toJSON() : null;
}
exports.get = get;

exports.upsert = async (fileRId, data) => {
  assert(fileRId, Errors.ERR_IS_REQUIRED('fileRId'))
  assert(data, Errors.ERR_IS_REQUIRED('data'))
  data = attempt(data, {
    amount: Joi.string().trim().required(),
  });
  const reward = await get(fileRId);
  if (reward) {
    await Reward.update(data, {
      where: {
        fileRId
      }
    });
  } else {
    await Reward.create({
      fileRId,
      ...data
    });
  }
  return true;
}