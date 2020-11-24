const {
  createQueue
} = require('./utils');
const Notification = require('../notification');
const config = require('../../config');

exports.createNotificationQueue = () => {
  const queue = createQueue(`${config.serviceKey}_NOTIFICATION`, {
    limiter: {
      max: 1,
      duration: 15 * 1000 * 1
    }
  });

  queue.add(`${config.serviceKey}_TRY_NOTIFY`, {}, {
    priority: 1,
    repeat: {
      every: 15 * 1000 * 1
    },
    removeOnComplete: true,
    removeOnFail: true
  });

  queue.process(`${config.serviceKey}_TRY_NOTIFY`, async () => {
    try {
      Notification.tryNotify();
    } catch (err) {
      console.log(err);
    }
  });

  return queue;
}