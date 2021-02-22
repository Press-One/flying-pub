const {
  createQueue
} = require('./utils');
const ChainSync = require('../../models/chainSync');
const config = require('../../config');

exports.createChainSyncCacheQueue = () => {
  const queue = createQueue(`${config.serviceKey}_SYNC_CHAIN`, {
    limiter: {
      max: 1,
      duration: 30 * 1000 * 1
    }
  });

  queue.add(`${config.serviceKey}_SYNC`, {}, {
    priority: 1,
    repeat: {
      every: 30 * 1000 * 1
    },
  });

  queue.process(`${config.serviceKey}_SYNC`, ChainSync.sync);

  return queue;
}