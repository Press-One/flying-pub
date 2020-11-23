const config = require('../config');
const Cache = require('./cache');
const {
  sleep
} = require('../utils');
const TYPE = `${config.serviceKey}_NOTIFICATION`;
const JOB_ID_PREFIX = 'JOB_';
const moment = require('moment');
const Mixin = require('./mixin');
const MessageSystem = require('./messageSystem');
const Log = require('./log');

exports.pushToNotificationQueue = async (data, options = {}) => {
  if (options.delaySeconds && options.delaySeconds > 0) {
    options.triggerAt = moment().add(options.delaySeconds, 'seconds').toISOString()
  }
  data.options = options;
  const jobName = options.jobName || new Date().getTime();
  await Cache.pSet(TYPE, `${JOB_ID_PREFIX}${jobName}`, JSON.stringify(data));
}

exports.cancelJobFromNotificationQueue = async (jobName) => {
  await Cache.pDel(TYPE, `${JOB_ID_PREFIX}${jobName}`);
}

exports.tryNotify = async () => {
  await Mixin.tryConnect();
  if (!Mixin.getConnected()) {
    console.log(`【消息通知】等待 Mixin 连接`);
    return;
  }
  const keys = await Cache.pFindKeys(TYPE, `${JOB_ID_PREFIX}*`);
  while (keys.length > 0) {
    try {
      const id = keys.shift().match(/JOB_(.*)/)[0];
      const data = await Cache.pGet(TYPE, id);
      if (data) {
        const json = JSON.parse(data);
        const {
          options
        } = json;
        if (options && options.triggerAt) {
          if (new Date() < new Date(options.triggerAt)) {
            continue;
          }
        }
        if (json.messageSystem) {
          const isSuccess = await MessageSystem.notify(json.messageSystem);
          if (!isSuccess) {
            Log.createAnonymity('站内信', `无法发送，保留消息，等待重试`);
            continue;
          }
        }
        if (json.mixin) {
          await Mixin.notify(json.mixin);
        }
      }
      await Cache.pDel(TYPE, id);
      await sleep(200);
    } catch (err) {
      console.log(err);
    }
  }
}