const Cache = require('../cache');
const config = require('../../config');
const {
  createSyncMixinSnapshotsQueue,
  createSyncInitializedQueue,
  createMixinNotificationQueue,
} = require('./mixin');
const {
  createAtomCacheQueue
} = require('./atom');
const {
  createViewCacheQueue
} = require('./view');
const queues = [];

exports.up = async () => {
  await Cache.pDeleteKeysByPattern(`bull:${config.serviceKey}*`);
  if (!(config.queueDisabledJobs || []).includes('mixin')) {
    queues.push(createSyncMixinSnapshotsQueue());
    queues.push(createSyncInitializedQueue());
  }
  if (!(config.queueDisabledJobs || []).includes('notification')) {
    queues.push(createMixinNotificationQueue());
  }
  if (!(config.queueDisabledJobs || []).includes('atom')) {
    queues.push(createAtomCacheQueue());
  }
  queues.push(createViewCacheQueue());
}

exports.down = () => {
  for (const queue of queues) {
    queue.close();
  }
}