const {
  createQueue
} = require('./utils');
const Finance = require('../finance');

exports.create = () => {
  const queue = createQueue('SYNC_MIXIN_SNAPSHOTS', {
    limiter: {
      max: 1,
      duration: 5 * 1000 * 1
    }
  });

  queue.add('SYNC', {}, {
    priority: 1,
    repeat: {
      every: 5 * 1000 * 1
    },
    removeOnComplete: true,
    removeOnFail: true
  });

  queue.process('SYNC', Finance.syncMixinSnapshots);

  return queue;
}