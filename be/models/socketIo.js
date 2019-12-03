const socketIo = require('socket.io');
const redisAdapter = require('socket.io-redis');
const User = require('./user');
const Cache = require('./cache');
const Log = require('./log');
const config = require('../config');
const {
  assert,
  Errors
} = require('./validator');
const {
  log
} = require('../utils');

let io;
const sessionKey = `${config.serviceKey}_SOCKET_SESSION`;

exports.EVENTS = {
  FILE_PUBLISHED: 'file_published'
}

const _log = (event, data) => {
  if (typeof data === 'string') {
    log(`【Socket IO | ${event}】： ${data}`);
  } else {
    log(`【Socket IO | ${event}】`);
    log(data);
  }
};

const getUserKey = userId => {
  return `USER_${userId}`;
}

exports.init = (redis, server) => {
  io = socketIo(server);
  io.adapter(
    redisAdapter({
      pubClient: redis.duplicate(),
      subClient: redis.duplicate()
    })
  )
  io.on('connection', socket => {
    _log('connection', 'socket 已连接');
    socket.on('authenticate', async userId => {
      _log('authenticate', `userId ${userId}`);
      if (!userId) {
        socket.emit('authenticate', {
          status: 'FAILED',
          message: '请传给我 userId'
        });
        return false;
      }
      const user = await User.get(userId);
      if (!user) {
        socket.emit('authenticate', {
          status: 'FAILED',
          message: '用户不存在'
        });
        return false;
      }
      const userKey = getUserKey(userId);
      await Cache.pSet(sessionKey, userKey, socket.id);
      socket.emit('authenticate', 'Socket 创建成功');
    });
  })
}

exports.sendToUser = async (userId, event, data) => {
  const userKey = getUserKey(userId);
  const userSocket = await Cache.pGet(sessionKey, userKey);
  assert(userSocket, Errors.ERR_NOT_FOUND('userSocket'));
  io.to(userSocket).emit(event, data);
  Log.create(userId, `收到通知 ${event}`);
}