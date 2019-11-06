const config = require('../../config');
const MixinQueue = require('./mixin');
const queues = [];

exports.up = () => {
  if (config.mixin.sync) {
    console.log(` ------------- 队列开始同步 Mixin 交易 ---------------`);
    queues.push(MixinQueue.create());
  }
}

exports.down = () => {
  for (const queue of queues) {
    queue.close();
  }
}