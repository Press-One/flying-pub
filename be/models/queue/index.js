const config = require('../../config');
const MixinQueue = require('./mixin');
const queues = [];

exports.up = () => {
  console.log(` ------------- 队列开始启动 ---------------`);
  if (config.mixin.sync) {
    queues.push(MixinQueue.create());
  }
}

exports.down = () => {
  for (const queue of queues) {
    queue.close();
  }
}