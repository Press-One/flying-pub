const request = require("request-promise");
const {
  generateSignature
} = require("./signature");
const Log = require('./log');
const config = require("../config");

const notify = async (payload, messageType = "private_message", channel = "all") => {
  if (!config.messageSystem) {
    return;
  }
  try {
    const data = {
      channel: channel,
      save_to_history: true,
      message_type: messageType,
      data: payload,
      access_key: config.messageSystem.accessKey,
      project: config.messageSystem.project,
      expired_at: parseInt(new Date().getTime() / 100) + 60 * 60 * 24 * 999
    };
    const sig = generateSignature(data);
    data["signature"] = sig;
    await request({
      uri: config.messageSystem.url,
      method: "POST",
      json: true,
      body: data,
      timeout: 5000
    }).promise();
    Log.createAnonymity('站内信', `成功发送 ${payload.sub_type} ${payload.message}`);
    return true;
  } catch (e) {
    console.log(e);
    Log.createAnonymity('站内信', `无法发送 ${payload.sub_type} ${payload.message}`);
    return false;
  }
}

const getCommentMentionPayload = data => {
  const {
    fromNickName,
    toUserName
  } = data;
  const payload = {
    type: "COMMENT",
    sub_type: "COMMENT_MENTION_ME",
    title: "有人回复了你",
    message: `${fromNickName}回复了你`,
    to_usernames: [toUserName],
    web: data,
  };
  return payload;
};

const getCommentLikePayload = data => {
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
  return payload;
};

const getArticleCommentPayload = data => {
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
  return payload;
};

const getArticleRewardPayload = data => {
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
  return payload;
};

const getArticleLikePayload = data => {
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
  return payload;
};

const getAuthorNewFollowerPayload = data => {
  const {
    fromNickName,
    toUserName
  } = data;
  const payload = {
    type: "AUTHOR_SUBSCRIPTION",
    sub_type: "AUTHOR_NEW_FOLLOWER",
    title: "有人关注了你",
    message: `${fromNickName}关注了你`,
    to_usernames: [toUserName],
    web: data,
  };
  return payload;
};

const getTopicNewFollowerPayload = data => {
  const {
    fromNickName,
    toUserName
  } = data;
  const payload = {
    type: "TOPIC_SUBSCRIPTION",
    sub_type: "TOPIC_NEW_FOLLOWER",
    title: "有人关注了你的专题",
    message: `${fromNickName}关注了你的专题`,
    to_usernames: [toUserName],
    web: data,
  };
  return payload;
};

const getBeContributedToTopicPayload = data => {
  const {
    toUserName
  } = data;
  const payload = {
    type: "TOPIC_CONTRIBUTION",
    sub_type: "TOPIC_POST_BE_CONTRIBUTED",
    title: "你有一篇文章被收录到专题",
    message: `你有一篇文章被收录到专题`,
    to_usernames: [toUserName],
    web: data,
  };
  return payload;
};

const getTopicRejectedContributionPayload = data => {
  const {
    toUserName
  } = data;
  const payload = {
    type: "TOPIC_CONTRIBUTION",
    sub_type: "TOPIC_REJECTED_CONTRIBUTION",
    title: "你有一篇文章被移除了专题",
    message: `你有一篇文章被移除了专题`,
    to_usernames: [toUserName],
    web: data,
  };
  return payload;
};

const getTopicReceivedContributionPayload = data => {
  const {
    toUserName
  } = data;
  const payload = {
    type: "TOPIC_CONTRIBUTION",
    sub_type: "TOPIC_RECEIVED_CONTRIBUTION",
    title: "有一篇文章投稿到了你的专题",
    message: `有一篇文章投稿到了你的专题`,
    to_usernames: [toUserName],
    web: data,
  };
  return payload;
};

const getTopicContributionRequestApprovedPayload = data => {
  const {
    toUserName
  } = data;
  const payload = {
    type: "TOPIC_CONTRIBUTION",
    sub_type: "TOPIC_CONTRIBUTION_REQUEST_APPROVED",
    title: "你有一个投稿请求已审核通过",
    message: `你有一个投稿请求已审核通过`,
    to_usernames: [toUserName],
    web: data,
  };
  return payload;
};

const getTopicContributionRequestRejectedPayload = data => {
  const {
    toUserName
  } = data;
  const payload = {
    type: "TOPIC_CONTRIBUTION",
    sub_type: "TOPIC_CONTRIBUTION_REQUEST_REJECTED",
    title: "你有一个投稿请求被拒绝了",
    message: `你有一个投稿请求被拒绝了`,
    to_usernames: [toUserName],
    web: data,
  };
  return payload;
};

module.exports = {
  notify,
  getCommentMentionPayload,
  getCommentLikePayload,
  getArticleRewardPayload,
  getArticleLikePayload,
  getArticleCommentPayload,
  getAuthorNewFollowerPayload,
  getTopicNewFollowerPayload,
  getBeContributedToTopicPayload,
  getTopicRejectedContributionPayload,
  getTopicReceivedContributionPayload,
  getTopicContributionRequestApprovedPayload,
  getTopicContributionRequestRejectedPayload
};