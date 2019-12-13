const Settings = require('./sequelize/settings');
const {
  assert,
  Errors
} = require('../models/validator');

const packSettings = settings => {
  const json = settings.toJSON();
  return JSON.parse(json.data);
}

exports.getByUserId = async userId => {
  const settings = await Settings.findOne({
    where: {
      userId
    }
  });
  return settings ? packSettings(settings) : null;
}

exports.upsert = async (userId, payload = {}) => {
  const {
    data
  } = payload;
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  const insertedSettings = await Settings.findOne({
    where: {
      userId
    }
  });
  if (insertedSettings) {
    await Settings.update({
      data: JSON.stringify(data)
    }, {
      where: {
        userId
      }
    });
    return true;
  }
  const settings = await Settings.create({
    userId,
    data: JSON.stringify(data),
  })
  return packSettings(settings);
}