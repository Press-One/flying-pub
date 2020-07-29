const request = require('request-promise');
const User = require('./user');
const Log = require('./sequelize/log');
const config = require('../config');
const Cache = require('./cache');
const {
  log
} = require('../utils');

exports.create = async (userId, message) => {
  const userDevice = await Cache.pGet('USER_DEVICE', String(userId));
  const user = await User.get(userId, {
    withProfile: true
  });
  const data = {
    userId,
    message: `【${config.serviceKey} ${userDevice}】${user.name}：${message}`,
  };
  await Log.create(data);
  if (config.bot && config.bot.enabled) {
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
  if (config.bot && config.bot.enabled) {
    try {
      sendToBot(data);
    } catch (e) {
      log(e);
    }
  }
}

const sendToBot = async data => {
  await request({
    uri: config.bot.url,
    method: 'post',
    json: true,
    body: {
      payload: data
    }
  }).promise();
};