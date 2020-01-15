const {
  createSyncInitializedQueue
} = require('./mixin');
const {
  createAtomCacheQueue
} = require('./atom');
const queues = [];

exports.up = () => {
  queues.push(createSyncInitializedQueue());
  queues.push(createAtomCacheQueue());
}

exports.down = () => {
  for (const queue of queues) {
    queue.close();
  }
}