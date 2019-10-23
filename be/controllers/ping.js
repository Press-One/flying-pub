// const config = require('../config');
// const pool = require('mysql2').createPool(config.mysql);
const {
  getRedis
} = require('../models/cache');

// const pingDB = () => {
//   return new Promise((resolve, reject) => {
//     pool.getConnection((err, conn) => {
//       if (err) {
//         console.error(err);
//         err.type = 'MySQL';
//         reject(err);
//         return;
//       }
//       conn.ping(err => {
//         if (err) {
//           console.error(err);
//           err.type = 'MySQL';
//           reject(err);
//           return;
//         }
//         resolve();
//       });
//       pool.releaseConnection(conn);
//     });
//   });
// };

const pingRedis = () => {
  const redis = getRedis();
  if (!redis) {
    return;
  }
  return new Promise((resolve, reject) => {
    redis.ping((err, res) => {
      if (err) {
        console.error(err);
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

exports.ping = async ctx => {
  try {
    // await pingDB();
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