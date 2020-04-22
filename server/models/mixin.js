const Mixin = require('mixin-node');
const config = require('../config');
const Log = require('./log');
const User = require('./user');
const Conversation = require('./conversation');
const Cache = require('./cache');
const TYPE = 'MIXIN_NOTIFY';
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

const sleep = (duration) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

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
        const {
          conversation_id,
          user_id
        } = msgObj.data;
        if (conversation_id && user_id) {
          await tryCreateConversation(msgObj);
        }
      }
    } catch (e) {
      mixinWsLog(e);
    }
  };

  mixin.start();
}

const tryCreateConversation = async msgObj => {
  try {
    const {
      conversation_id,
      user_id
    } = msgObj.data;
    const user = await User.getByMixinAccountId(user_id);
    const conversation = await Conversation.tryCreateConversation(user.id, {
      conversationId: conversation_id,
      mixinAccountId: user_id,
      raw: JSON.stringify(msgObj)
    });
    if (conversation) {
      Log.create(user.id, '开通 Mixin 通知');
    }
  } catch (e) {
    console.log(e);
  }
}

const trySendToUser = async (userId, text, options = {}) => {
  await trySendText(userId, text);
  const {
    url
  } = options;
  if (url) {
    console.log({
      url
    });
    await sleep(1000);
    await trySendButton(userId, `[{ "label": "去看看", "color": "#4A90E2", "action": "${url}" }]`);
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
  console.log({
    text,
    options
  });
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
    console.log(` ------------- tryNotify ---------------`);
    if (!connected) {
      return false;
    }
    const keys = await Cache.pFindKeys(TYPE, `${JOB_ID_PREFIX}*`);
    if (keys.length > 0) {
      console.log({
        keys
      });
    }
    while (keys.length > 0) {
      const id = keys.shift().match(/JOB_(.*)/)[0];
      const data = await Cache.pGet(TYPE, id);
      console.log({
        data
      });
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
    }
  } catch (e) {
    console.log(e);
  }
}