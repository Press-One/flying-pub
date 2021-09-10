const {
  createQueue
} = require('./utils');
const Chain = require('../../models/chain');
const config = require('../../config');

exports.createChainSubmitBlockQueue = () => {
  const queue = createQueue(`${config.serviceKey}_SUBMIT_BLOCK`, {
    limiter: {
      max: 1,
      duration: 10 * 1000 * 1
    }
  });

  queue.add(`${config.serviceKey}_SUBMIT`, {}, {
    priority: 1,
    repeat: {
      every: 10 * 1000 * 1
    },
  });

  queue.process(`${config.serviceKey}_SUBMIT`, Chain.submit);

  return queue;
}

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

  queue.process(`${config.serviceKey}_SYNC`, Chain.sync);

  return queue;
}