const Mixin = require('mixin-node');
const config = require('../config');
const Log = require('./log');
const Profile = require('./profile');
const Conversation = require('./conversation');
const Cache = require('./cache');
const {
  sleep
} = require('../utils');
const TYPE = `${config.serviceKey}_MIXIN_NOTIFY`;
const JOB_ID_PREFIX = 'JOB_';

let enabled = false;
let connected = false;

exports.get = async providerId => {
  const profile = await Profile.findOne({
    where: {
      providerId
    }
  });
  return profile ? profile.toJSON() : null;
}

const mixin = new Mixin({
  client_id: config.provider.mixin.clientId,
  aeskey: config.provider.mixin.aesKey,
  pin: config.provider.mixin.pinCode,
  session_id: config.provider.mixin.sessionId,
  privatekey: Buffer.from(config.provider.mixin.privateKey, 'utf8')
});

const mixinWsLog = (message) => {
  if (!message.includes('Error')) {
    console.log(`【Mixin WebSocket】: ${message}`);
  }
};

const start = () => {
  mixin.onConnect = () => {
    mixinWsLog('Connected.');
    connected = true;
    try {
      mixin.sendMsg('LIST_PENDING_MESSAGES');
    } catch (e) {
      mixinWsLog(e);
    }
  };

  mixin.onReconnect = () => {
    mixinWsLog('Reconnecting...');
  };

  mixin.onError = (event) => {
    mixinWsLog(`Error: ${event.message}`);
  };

  mixin.onClosed = (event) => {
    mixinWsLog(`onClosed: ${event.code} ${event.reason}`);
  };

  mixin.onDestroyed = (event) => {
    mixinWsLog(`Destroyed: ${event.reason}`);
  };

  mixin.onMessage = async (data) => {
    try {
      const msgObj = await mixin.decode(data);
      if (
        msgObj.action && msgObj.data &&
        msgObj.action !== 'ACKNOWLEDGE_MESSAGE_RECEIPT' &&
        msgObj.action !== 'LIST_PENDING_MESSAGES'
      ) {
        const receipt_id = await mixin.sendMsg('ACKNOWLEDGE_MESSAGE_RECEIPT', {
          message_id: msgObj.data.message_id
        });
        mixinWsLog(`Sent ACKNOWLEDGE_MESSAGE_RECEIPT id: ${receipt_id}`);
        mixinWsLog(`Receive message: `);
        console.log(msgObj);
        const {
          conversation_id,
          user_id
        } = msgObj.data;
        if (conversation_id && user_id) {
          const profile = await Profile.getByMixinAccountId(user_id);
          if (!profile) {
            await mixin.sendText('飞帖没有查询到你的账户信息，请先到飞帖登录一下', msgObj);
            return;
          }
          try {
            await tryCreateConversation(profile.userId, msgObj);
            await trySendText(profile.userId, '你成功开通了消息提醒。一旦有已关注的作者发布新文章、或者是其他人在评论区 @ 你，我会第一时间通知你');
          } catch (e) {
            console.log(e);
            await mixin.sendText('服务出错了', msgObj);
          }
        }
      }
    } catch (e) {
      mixinWsLog(e);
    }
  };

  mixin.start();
}

const tryCreateConversation = async (userId, msgObj) => {
  const {
    conversation_id,
    user_id
  } = msgObj.data;
  const conversation = await Conversation.tryCreateConversation(userId, {
    conversationId: conversation_id,
    mixinAccountId: user_id,
    raw: JSON.stringify(msgObj)
  });
  if (conversation) {
    Log.create(userId, '开通 Mixin 通知');
  }
}

const trySendToUser = async (userId, text, options = {}) => {
  const {
    url
  } = options;
  if (url) {
    await trySendButton(userId, `[{ "label": "${text}", "color": "#4A90E2", "action": "${url}" }]`);
  } else {
    await trySendText(userId, text);
  }
}

const trySendText = async (userId, text) => {
  const conversation = await Conversation.get(userId);
  if (!conversation) {
    Log.create(userId, '我还没有开通 Mixin 通知，无法收到通知');
    return false;
  }
  const options = {
    data: {
      conversation_id: conversation.conversationId,
      user_id: conversation.mixinAccountId,
    }
  };
  await mixin.sendText(text, options);
  Log.create(userId, `收到 Mixin 通知， ${text}`);
}

const trySendButton = async (userId, text) => {
  const conversation = await Conversation.get(userId);
  if (!conversation) {
    return false;
  }
  const options = {
    data: {
      conversation_id: conversation.conversationId,
      user_id: conversation.mixinAccountId,
    }
  };
  await mixin.sendButton(text, options);
}

exports.pushToNotifyQueue = async data => {
  await Cache.pSet(TYPE, `${JOB_ID_PREFIX}${new Date().getTime()}`, JSON.stringify(data));
}

exports.tryNotify = async () => {
  if (!enabled) {
    enabled = true;
    try {
      start(mixin);
    } catch (e) {
      mixinWsLog(e);
    }
  }
  try {
    if (!connected) {
      return false;
    }
    const keys = await Cache.pFindKeys(TYPE, `${JOB_ID_PREFIX}*`);
    while (keys.length > 0) {
      const id = keys.shift().match(/JOB_(.*)/)[0];
      const data = await Cache.pGet(TYPE, id);
      if (data) {
        const {
          userId,
          text,
          url
        } = JSON.parse(data);
        await trySendToUser(userId, text, {
          url
        });
      }
      await Cache.pDel(TYPE, id);
      await sleep(200);
    }
  } catch (e) {
    console.log(e);
  }
}