const {
  createQueue
} = require('./utils');
const Finance = require('../finance');
const config = require('../../config');

exports.create = () => {
  const queue = createQueue(`${config.serviceName.toUpperCase()}_SYNC_MIXIN_SNAPSHOTS`, {
    limiter: {
      max: 1,
      duration: 1 * 1000 * 1,
      bounceBack: true
    }
  });

  queue.add(`${config.serviceName.toUpperCase()}_SYNC`, {}, {
    priority: 1,
    repeat: {
      every: 1 * 1000 * 1
    },
  });

  queue.process(`${config.serviceName.toUpperCase()}_SYNC`, Finance.syncMixinSnapshots);

  return queue;
}