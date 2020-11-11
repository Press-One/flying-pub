const {
  createQueue
} = require('./utils');
const View = require('../../cache/view');
const config = require('../../config');

exports.createViewCacheQueue = () => {
  const queue = createQueue(`${config.serviceKey}_SYNC_VIEW`, {
    limiter: {
      max: 1,
      duration: 60 * 1000 * 1
    }
  });

  queue.add(`${config.serviceKey}_SYNC`, {}, {
    priority: 1,
    repeat: {
      every: 60 * 1000 * 1
    },
  });

  queue.process(`${config.serviceKey}_SYNC`, View.sync);

  return queue;
}