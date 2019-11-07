const {
  createQueue
} = require('./utils');
const Finance = require('../finance');
const config = require('../../config');

exports.create = () => {
  const queue = createQueue(`${config.serviceName}_SYNC_MIXIN_SNAPSHOTS`, {
    limiter: {
      max: 2,
      duration: 10 * 1000 * 1,
      // bounceBack: true
    }
  });

  queue.add(`${config.serviceName}_SYNC`, {}, {
    priority: 1,
    repeat: {
      every: 1 * 1000 * 1
    },
  });

  queue.process(`${config.serviceName}_SYNC`, Finance.syncMixinSnapshots);

  return queue;
}