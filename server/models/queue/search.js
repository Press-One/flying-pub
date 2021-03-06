const {
  createQueue
} = require('./utils');
const Post = require('../post');
const config = require('../../config');

exports.createSyncSearchIndexQueue = () => {
  const queue = createQueue(`${config.serviceKey}_SYNC_SEARCH`, {
    limiter: {
      max: 1,
      duration: (config.search.queueDuration || 120) * 1000 * 1
    }
  });

  queue.add(`${config.serviceKey}_SYNC`, {}, {
    priority: 1,
    repeat: {
      every: (config.search.queueDuration || 120) * 1000 * 1
    },
    removeOnComplete: true,
    removeOnFail: true
  });

  queue.process(`${config.serviceKey}_SYNC`, Post.syncToSearchService);

  return queue;
}
