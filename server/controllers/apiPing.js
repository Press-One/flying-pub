const {
  getRedis
} = require('../models/cache');

const pingRedis = () => {
  const redis = getRedis();
  if (!redis) {
    return;
  }
  return new Promise((resolve, reject) => {
    redis.ping((err, res) => {
      if (err) {
        err.type = 'Redis';
        reject(err);
        return;
      }
      if (res !== 'PONG') {
        const err = new Error(res);
        err.type = 'Redis';
        reject(err);
      }
      resolve();
    });
  });
};

exports.ping = async (ctx) => {
  try {
    await pingRedis();
    ctx.body = 'pong';
  } catch (err) {
    ctx.status = 400;
    if (err.type) {
      ctx.message = `[${err.type}] ${err.message}`;
    } else {
      ctx.message = err.message;
    }
  }
};