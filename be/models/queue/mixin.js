const {
  createQueue
} = require('./utils');
const Finance = require('../finance');
const config = require('../../config');
const Cache = require('../cache');

exports.createSyncInitializedQueue = async () => {
  const queueName = `${config.serviceKey}_SYNC_INITIALIZED_RECEIPTS`;
  await Cache.pDeleteKeysByPattern(`bull:${queueName}*`);
  const queue = createQueue(queueName, {
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
    removeOnComplete: true,
    removeOnFail: true
  });

  queue.process(`${config.serviceKey}_SYNC`, Finance.syncInitializedReceipts);

  return queue;
}