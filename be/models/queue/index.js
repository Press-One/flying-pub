const Cache = require('../cache');
const {
  createSyncInitializedQueue
} = require('./mixin');
const {
  createAtomCacheQueue
} = require('./atom');
const queues = [];

exports.up = async () => {
  await Cache.pDeleteKeysByPattern('bull:*');
  queues.push(createSyncInitializedQueue());
  queues.push(createAtomCacheQueue());
}

exports.down = () => {
  for (const queue of queues) {
    queue.close();
  }
}