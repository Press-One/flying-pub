const request = require('request-promise');
const {
  createQueue
} = require('./utils');
const ApiAtom = require('../../controllers/apiAtom');
const config = require('../../config');

exports.createAtomCacheQueue = () => {
  const queue = createQueue(`${config.serviceKey}_ATOM_CACHE`, {
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

  queue.process(`${config.serviceKey}_SYNC`, ApiAtom.sync);

  return queue;
}