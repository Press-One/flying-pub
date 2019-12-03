const config = require('../../config');
const {
  createSyncInitializedQueue
} = require('./mixin');
const queues = [];

exports.up = () => {
  if (config.mixin.sync) {
    queues.push(createSyncInitializedQueue());
  }
}

exports.down = () => {
  for (const queue of queues) {
    queue.close();
  }
}