const {
  createQueue
} = require('./utils');
const Finance = require('../finance');
const Mixin = require('../mixin');
const config = require('../../config');

exports.createSyncMixinSnapshotsQueue = () => {
  const queue = createQueue(`${config.serviceKey}_SYNC_MIXIN_SNAPSHOTS`, {
    limiter: {
      max: 2,
      duration: 10 * 1000 * 1
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

  queue.process(`${config.serviceKey}_SYNC`, Finance.syncMixinSnapshots);

  return queue;
}

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
    removeOnComplete: true,
    removeOnFail: true
  });

  queue.process(`${config.serviceKey}_SYNC`, Finance.syncInitializedReceipts);

  return queue;
}

exports.createMixinNotificationQueue = () => {
  const queue = createQueue(`${config.serviceKey}_MIXIN_NOTIFICATION`, {
    limiter: {
      max: 1,
      duration: 5 * 1000 * 1
    }
  });

  queue.add(`${config.serviceKey}_TRY_NOTIFY`, {}, {
    priority: 1,
    repeat: {
      every: 5 * 1000 * 1
    },
    removeOnComplete: true,
    removeOnFail: true
  });

  queue.process(`${config.serviceKey}_TRY_NOTIFY`, Mixin.tryNotify);

  return queue;
}