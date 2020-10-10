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
  const user = await User.get(userId);
  const version = user.version ? `(v${user.version})` : '';
  const SSO_FLAG = user.SSO ? ' SSO' : '';
  const data = {
    userId,
    message: `【${config.serviceKey} ${userDevice || ''}】${user.nickname}${version}${SSO_FLAG}：${message}`,
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