const Queue = require('bull');
const config = require('../../config');

exports.createQueue = (name, options = {}) => {
  options = {
    redis: {
      port: config.redis.port,
      host: config.redis.host,
      password: config.redis.password
    },
    ...options
  };
  const queue = new Queue(name || 'default queue', options);
  return queue;
};