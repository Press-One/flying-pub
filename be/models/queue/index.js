const config = require('../../config');
const {
  createSyncInitializedQueue
} = require('./mixin');
const queues = [];

exports.up = () => {
  if (config.mixin.sync) {
    console.log(` ------------- 队列开始同步 Mixin 交易 ---------------`);
    queues.push(createSyncInitializedQueue());
  }
}

exports.down = () => {
  for (const queue of queues) {
    queue.close();
  }
}