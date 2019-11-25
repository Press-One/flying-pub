const {
  createQueue
} = require('./utils');
const Finance = require('../finance');
const config = require('../../config');

exports.createSyncInitializedQueue = () => {
  const queue = createQueue(`${config.serviceKey}_SYNC_INITIALIZED_RECEIPTS`, {
    limiter: {
      max: 1,
      duration: 1 * 1000 * 1
    }
  });

  queue.add(`${config.serviceKey}_SYNC`, {}, {
    priority: 1,
    repeat: {
      every: 1 * 1000 * 1
    },
  });

  queue.process(`${config.serviceKey}_SYNC`, Finance.syncInitializedReceipts);

  return queue;
}