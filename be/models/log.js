const request = require('request-promise');
const User = require('./user');
const Log = require('./sequelize/log');
const config = require('../config');
const {
  log
} = require('../utils');

exports.create = async (userId, message) => {
  const user = await User.get(userId, {
    withProfile: true
  });
  const data = {
    userId,
    message: `【${config.serviceKey}】${user.name}：${message}`,
  };
  await Log.create(data);
  if (config.telegramBot.enabled) {
    try {
      sendToBot(data);
    } catch (e) {
      log(e);
    }
  }
}

exports.createAnonymity = async (identity, message) => {
  const data = {
    userId: 0,
    message: `【${config.serviceKey}】 ${identity}：${message}`,
  };
  await Log.create(data);
  if (config.telegramBot.enabled) {
    try {
      sendToBot(data);
    } catch (e) {
      log(e);
    }
  }
}

const sendToBot = async data => {
  await request({
    uri: config.telegramBot.url,
    method: 'post',
    json: true,
    body: {
      payload: data
    }
  }).promise();
};