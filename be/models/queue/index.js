const config = require('../../config');
const {
  createSyncInitializedQueue
} = require('./mixin');
const {
  createAtomCacheQueue
} = require('./atom');
const queues = [];

exports.up = () => {
  if (config.provider.mixin.sync) {
    queues.push(createSyncInitializedQueue());
  }
  queues.push(createAtomCacheQueue());
}

exports.down = () => {
  for (const queue of queues) {
    queue.close();
  }
}