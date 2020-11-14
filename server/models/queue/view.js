const {
  createQueue
} = require('./utils');
const View = require('../../models/view');
const config = require('../../config');

exports.createViewSyncQueue = () => {
  const queue = createQueue(`${config.serviceKey}_SYNC_VIEW`, {
    limiter: {
      max: 1,
      duration: 60 * 1000 * 1
    }
  });

  queue.add(`${config.serviceKey}_SYNC`, {}, {
    priority: 1,
    repeat: {
      every: 60 * 1000 * 1
    },
  });

  queue.process(`${config.serviceKey}_SYNC`, View.sync);

  return queue;
}

exports.createAddAvgViewQueue = () => {
  const queue = createQueue(`${config.serviceKey}_AVG_VIEW_ADDING`, {
    limiter: {
      max: 1,
      duration: config.postView.avgViewAddingDuration || 60 * 1000 * 1
    }
  });

  queue.add(`${config.serviceKey}_ADD`, {}, {
    priority: 1,
    repeat: {
      every: config.postView.avgViewAddingDuration || 60 * 1000 * 1
    },
  });

  queue.process(`${config.serviceKey}_ADD`, View.addAvgView);
  return queue;
}

exports.createAddHotViewQueue = () => {
  const queue = createQueue(`${config.serviceKey}_HOT_VIEW_ADDING`, {
    limiter: {
      max: 1,
      duration: config.postView.hotViewAddingDuration || 60 * 1000 * 1
    }
  });

  queue.add(`${config.serviceKey}_ADD`, {}, {
    priority: 1,
    repeat: {
      every: config.postView.hotViewAddingDuration || 60 * 1000 * 1
    },
  });

  queue.process(`${config.serviceKey}_ADD`, View.addHotView);
  return queue;
}

exports.createPublishViewQueue = () => {
  const queue = createQueue(`${config.serviceKey}_PUBLISH_VIEW_ADDING`, {
    limiter: {
      max: 1,
      duration: 30 * 1000 * 1
    }
  });

  queue.add(`${config.serviceKey}_ADD`, {}, {
    priority: 1,
    repeat: {
      every: 30 * 1000 * 1
    },
  });

  queue.process(`${config.serviceKey}_ADD`, View.addViewAfterPublishNewPost);
  return queue;
}