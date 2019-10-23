const queues = [];

exports.up = () => {
  console.log(` ------------- 队列开始启动 ---------------`);
  // queues.push(BlockQueue.create());
}

exports.down = () => {
  for (const queue of queues) {
    queue.close();
  }
}