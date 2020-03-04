const {
  createQueue
} = require('./utils');
const Atom = require('../../models/atom');
const config = require('../../config');
const Cache = require('../cache');

exports.createAtomCacheQueue = async () => {
  const queueName = `${config.serviceKey}_SYNC_ATOM`;
  await Cache.pDeleteKeysByPattern(`bull:${queueName}*`);
  const queue = createQueue(queueName, {
    limiter: {
      max: 1,
      duration: 10 * 1000 * 1
    }
  });

  queue.add(`${config.serviceKey}_SYNC`, {}, {
    priority: 1,
    repeat: {
      every: 10 * 1000 * 1
    },
    removeOnComplete: true,
    removeOnFail: true
  });

  queue.process(`${config.serviceKey}_SYNC`, Atom.sync);

  return queue;
}