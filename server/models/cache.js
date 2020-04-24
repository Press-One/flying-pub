'use strict';

let async = require('async');
let ioredis = require('ioredis');
let util = require('util');
const config = require('../config');

let redis;

var getKey = function (type, id, callback) {
  if (!type || !id) {
    return callback ? callback('Error cache type or id.') : null;
  }
  var key = 'PRSCACHE_' + type.toUpperCase() + '_' + String(id);
  return callback ? callback(null, key) : key;
};

var getKeys = function (type, ids, callback) {
  if (!type || !ids || !ids.length) {
    return callback ? callback('Error cache type or ids.') : null;
  }
  var result = [];
  for (var i in ids) {
    var id = getKey(type, ids[i]);
    if (id) {
      result.push(id);
    }
  }
  return callback ? callback(null, result) : result;
};

var rawSet = function (type, id, data, options, callback) {
  options = options || {};
  getKey(type, id, function (err, key) {
    if (err) {
      return callback(err);
    }
    var value = JSON.stringify(data);
    var args = [key, value];
    for (var i in options) {
      if (['EX', 'PX'].indexOf(i) !== -1 && options[i]) {
        args.push(i, options[i]);
      }
      options['NX'] && args.push('NX');
      options['XX'] && args.push('XX');
    }
    redis.set(args, callback || function () {});
  });
};

var set = function (type, id, data, callback) {
  rawSet(type, id, data, {}, callback);
};

var setWithExpired = function (type, id, data, ex, nx, callback) {
  rawSet(type, id, data, {
    EX: ex,
    NX: nx
  }, callback);
};

var del = function (type, id, callback) {
  getKey(type, id, function (err, key) {
    if (err) {
      return callback(err);
    }
    redis.del(key, callback || function () {});
  });
};

let lrem = function (type, id, data, callback) {
  getKey(type, id, function (err, key) {
    if (err) {
      return callback(err);
    }
    redis.lrem(key, 0, data, callback || function () {});
  });
};

var findKeys = function (type, preStr, callback) {
  getKey(type, preStr, function (err, key) {
    if (err) {
      return callback(err);
    }
    redis.keys(key, callback);
  });
};

var findAndDel = function (type, preStr, callback) {
  findKeys(type, preStr, function (err, data) {
    if (err) {
      return callback(err);
    }
    async.eachSeries(data, function (item, cbf) {
      redis.del(item, function (err, result) {
        cbf();
      });
    }, function (result) {
      callback(null, data.length);
    });
  });
};

var smartDel = function (type, id, callback) {
  return /^.*\*$/.test(id) ?
    findAndDel(type, id, callback) : del(type, id, callback);
};

var get = function (type, id, callback) {
  getKey(type, id, function (err, key) {
    if (err) {
      return callback(err);
    }
    redis.get(key, function (err, reply) {
      if (err) {
        return callback(err);
      }
      var value = null;
      try {
        value = JSON.parse(reply);
      } catch (err) {
        return callback(err);
      }
      callback(null, value);
    });
  });
};

var mGet = function (type, ids, callback) {
  getKeys(type, ids, function (err, keys) {
    if (err) {
      return callback(err);
    }
    redis.mget(keys, function (err, reply) {
      if (err) {
        return callback(err);
      }
      var values = [];
      for (var i in reply) {
        var value = null;
        try {
          value = JSON.parse(reply[i]);
        } catch (err) {
          return callback(err);
        }
        if (value) {
          values.push(value);
        }
      }
      callback(null, values);
    });
  });
};

let rawPush = (type, id, left, values, callback) => {
  getKey(type, id, (err, key) => {
    if (err) {
      return callback(err);
    }
    callback = callback || function () {};
    left ? redis.lpush(key, values, callback) :
      redis.rpush(key, values, callback);
  });
};

let lPush = (type, id, values, callback) => {
  rawPush(type, id, true, values, callback);
};

let rPush = (type, id, values, callback) => {
  rawPush(type, id, false, values, callback);
};

let lRange = (type, id, start, stop, callback) => {
  getKey(type, id, (err, key) => {
    if (err) {
      return callback(err);
    }
    redis.lrange(key, start, stop, (err, reply) => {
      callback(err, reply);
    });
  });
};

let getList = (type, id, callback) => {
  lRange(type, id, 0, -1, callback);
};

let tryLock = (key, timeout, callback) => { // 有返回值表示已经被锁，需要等待。
  get('lock', key, (err, data) => {
    if (err || data) {
      return callback(err, true);
    }
    lock(key, timeout, (err, data) => {
      if (err || !data) {
        callback(err, true);
      }
      callback(err, false);
    });
  });
};
let pTryLock = util.promisify(tryLock);

let lock = (key, timeout, callback) => {
  timeout = ~~timeout;
  setWithExpired('lock', key, new Date(), timeout || 30, true, callback);
};

let unLock = (key, callback) => {
  del('lock', key, callback);
};

let pUnLock = util.promisify(unLock);

let pDeleteKeysByPattern = (pattern) => {
  return new Promise((resolve, reject) => {
    const stream = redis.scanStream({
      match: pattern
    });
    stream.on("data", (keys) => {
      if (keys.length) {
        const pipeline = redis.pipeline();
        keys.forEach((key) => {
          pipeline.del(key);
        });
        pipeline.exec();
      }
    });
    stream.on("end", () => {
      resolve();
    });
    stream.on("error", (e) => {
      reject(e);
    });
  });
};

let init = () => {
  redis = new ioredis({
    port: config.redis.port,
    host: config.redis.host,
    password: config.redis.password ?
      config.redis.password : null
  });
  return redis;
};

let getRedis = () => {
  return redis;
}

const cache = {
  getRedis,
  set,
  get,
  mGet,
  lPush,
  rPush,
  lRange,
  getList,
  del,
  lrem,
  smartDel,
  setWithExpired,
  tryLock,
  lock,
  unLock,
  init,
  pTryLock,
  pUnLock,
  pDeleteKeysByPattern
};

cache.pSet = util.promisify(set.bind(cache));
cache.pSetWithExpired = util.promisify(setWithExpired.bind(cache));
cache.pGet = util.promisify(get.bind(cache));
cache.pDel = util.promisify(del.bind(cache));
cache.pFindAndDel = util.promisify(findAndDel.bind(cache));
cache.pFindKeys = util.promisify(findKeys.bind(cache));

module.exports = cache;