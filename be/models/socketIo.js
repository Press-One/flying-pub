const socketIo = require('socket.io');
const redisAdapter = require('socket.io-redis');
const User = require('./user');
const Cache = require('./cache');
const Log = require('./log');
const {
  assert,
  Errors
} = require('./validator');

let io;
const sessionKey = 'SOCKET_SESSION';

exports.EVENTS = {
  FILE_PUBLISHED: 'file_published'
}

const log = (event, data) => {
  if (typeof data === 'string') {
    console.log(`【Socket IO | ${event}】： ${data}`);
  } else {
    console.log(`【Socket IO | ${event}】`);
    console.log(data);
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
    log('connection', 'socket 已连接');
    socket.on('authenticate', async userId => {
      log('authenticate', `userId ${userId}`);
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
  Log.create(userId, `收到提醒：event ${event}, file id: ${data.id}`);
}

exports.getSocketIo = () => io;