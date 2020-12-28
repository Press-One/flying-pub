const Mixin = require('mixin-node');
const config = require('../config');
const Log = require('./log');
const Profile = require('./profile');
const Conversation = require('./conversation');
const {
  sleep
} = require('../utils');

let enabled = false;
let connected = false;

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
            await mixin.sendText(`${config.settings['site.name']}没有查询到你的 Mixin 账户信息，请先到${config.settings['site.name']}登录注册一下。如果你是用手机注册的，请到${config.settings['site.name']}绑定当前 Mixin 账号噢。`, msgObj);
            await sleep(1000);
            await mixin.sendText('如有疑问，可以联系技术支持，Mixin ID 是：', msgObj);
            await sleep(1000);
            await mixin.sendText('39150127', msgObj);
            return;
          }
          try {
            const conversation = await tryCreateConversation(profile.userId, msgObj);
            if (conversation) {
              await trySendText(profile.userId, '你成功开通了消息提醒。当有新的消息，我会第一时间通知你');
            } else {
              await trySendText(profile.userId, '哈喽，如果你在使用的时候遇到了问题，可以联系技术支持，Mixin ID 是：');
              await sleep(1000);
              await trySendText(profile.userId, '39150127');
            }
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
  return conversation;
}

const trySendToUser = async (userId, text, options = {}) => {
  const {
    url,
    desc,
  } = options;
  if (desc) {
    await trySendCard(userId, `{"app_id": "${config.provider.mixin.clientId}", "icon_url": "${config.logo || config.settings['site.logo']}", "title": "${text}", "description": "${desc}", "action": "${url}"}`);
  } else if (url) {
    await trySendButton(userId, `[{ "label": "${text}", "color": "#4A90E2", "action": "${url}" }]`);
  } else {
    await trySendText(userId, text);
  }
  Log.create(userId, `收到 Mixin 通知：${text}`);
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

const trySendCard = async (userId, text) => {
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
  await mixin.sendCard(text, options);
}

exports.tryConnect = async () => {
  if (!enabled) {
    enabled = true;
    try {
      start(mixin);
    } catch (e) {
      mixinWsLog(e);
    }
  }
}

exports.notify = async data => {
  try {
    await trySendToUser(data.userId, data.text, {
      url: data.url,
      desc: data.desc,
    });
  } catch (e) {
    console.log(e);
  }
}

exports.getConnected = () => {
  return connected;
}
