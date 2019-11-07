const request = require('request-promise');
const User = require('./user');
const Log = require('./sequelize/log');
const config = require('../config');

exports.create = async (userId, message) => {
  const user = await User.get(userId, {
    withProfile: true
  });
  const data = {
    userId,
    message: `【${config.serviceName}】${user.name}：${message}`,
  };
  await Log.create(data);
  if (config.botEnabled) {
    try {
      sendToBot(data);
    } catch (e) {
      console.log(e);
    }
  }
}

exports.createAnonymity = async (identity, message) => {
  const data = {
    userId: 0,
    message: `【${config.serviceName}】 ${identity}：${message}`,
  };
  await Log.create(data);
  if (config.botEnabled) {
    try {
      sendToBot(data);
    } catch (e) {
      console.log(e);
    }
  }
}

const sendToBot = async data => {
  await request({
    uri: config.botUrl,
    method: 'post',
    json: true,
    body: {
      payload: data
    }
  }).promise();
};