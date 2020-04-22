const Cache = require('../cache');
const config = require('../../config');
const {
  createSyncInitializedQueue,
  createMixinNotificationQueue
} = require('./mixin');
const {
  createAtomCacheQueue
} = require('./atom');
const queues = [];

exports.up = async () => {
  await Cache.pDeleteKeysByPattern(`bull:${config.serviceKey}*`);
  queues.push(createSyncInitializedQueue());
  queues.push(createMixinNotificationQueue());
  queues.push(createAtomCacheQueue());
}

exports.down = () => {
  for (const queue of queues) {
    queue.close();
  }
}