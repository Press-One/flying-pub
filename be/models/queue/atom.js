const {
  createQueue
} = require('./utils');
const Atom = require('../../models/atom');
const config = require('../../config');

exports.createAtomCacheQueue = () => {
  const queue = createQueue(`${config.serviceKey}_SYNC_ATOM`, {
    limiter: {
      max: 1,
      duration: 20 * 1000 * 1
    }
  });

  queue.add(`${config.serviceKey}_SYNC`, {}, {
    priority: 1,
    repeat: {
      every: 20 * 1000 * 1
    },
  });

  queue.process(`${config.serviceKey}_SYNC`, Atom.sync);

  return queue;
}