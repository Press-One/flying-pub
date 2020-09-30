const request = require("request-promise");
const {
  generateSignature
} = require("./signature");
const Log = require('./log');
const config = require("../config");

async function notify(payload, messageType = "private_message", channel = "all") {
  try {
    const data = {
      channel: channel,
      save_to_history: true,
      message_type: messageType,
      data: payload,
      access_key: config.messageSystem.accessKey,
      project: config.messageSystem.project,
    };
    const sig = generateSignature(data);
    data["signature"] = sig;
    await request({
      uri: config.messageSystem.url,
      method: "POST",
      json: true,
      body: data,
    }).promise();
    Log.createAnonymity('站内信', `成功发送 ${payload.sub_type} ${payload.message}`);
  } catch (e) {
    console.log(e);
    Log.createAnonymity('站内信', `无法发送 ${payload.sub_type} ${payload.message}`);
  }
}

const notifyCommentMention = async (data) => {
  const {
    fromNickName,
    fromArticleTitle,
    toUserName
  } = data;
  const payload = {
    type: "COMMENT",
    sub_type: "COMMENT_MENTION_ME",
    title: "有人@了你",
    message: `${fromNickName}在评论中@你`,
    to_usernames: [toUserName],
    web: data,
  };
  try {
    await notify(payload);
  } catch (e) {
    console.error(e);
  }
};

const notifyCommentLike = async (data) => {
  const {
    fromNickName,
    toUserName
  } = data;
  const payload = {
    type: "COMMENT",
    sub_type: "LIKE",
    title: "收到的赞",
    message: `${fromNickName}赞了你的评论`,
    to_usernames: [toUserName],
    web: data,
  };
  try {
    await notify(payload);
  } catch (e) {
    console.error(e);
  }
};

const notifyArticleComment = async (data) => {
  const {
    fromNickName,
    fromArticleTitle,
    toUserName
  } = data;
  const payload = {
    type: "ARTICLE",
    sub_type: "ARTICLE_COMMENT",
    title: "有人评论了你的文章",
    message: `${fromNickName}刚刚评论了你的文章《${fromArticleTitle}》`,
    to_usernames: [toUserName],
    web: data,
  };
  try {
    await notify(payload);
  } catch (e) {
    console.error(e);
  }
};

const notifyArticleReward = async (data) => {
  const {
    fromNickName,
    fromArticleTitle,
    toUserName,
    amount,
    currency
  } = data;
  const payload = {
    type: "ARTICLE",
    sub_type: "ARTICLE_REWARD",
    title: "有人打赏了你的文章",
    message: `${fromNickName}刚刚打赏你的文章《${fromArticleTitle}》${amount} ${currency}`,
    to_usernames: [toUserName],
    web: data,
  };
  try {
    await notify(payload);
  } catch (e) {
    console.error(e);
  }
};

const notifyArticleLike = async (data) => {
  const {
    fromNickName,
    fromArticleTitle,
    toUserName
  } = data;
  const payload = {
    type: "ARTICLE",
    sub_type: "LIKE",
    title: "有人赞了你的文章",
    message: `${fromNickName}刚刚赞了你的文章《${fromArticleTitle}》`,
    to_usernames: [toUserName],
    web: data,
  };
  try {
    await notify(payload);
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  notify,
  notifyCommentMention,
  notifyCommentLike,
  notifyArticleReward,
  notifyArticleLike,
  notifyArticleComment
};