const config = require('../config');
const request = require('request-promise');

exports.get = async (ctx) => {
  const atom = await request({
    // uri: `https://xue-posts.press.one/output/${config.topicAddress}`
    uri: `https://xue-posts.xue.cn/output/b6b17424f87ffb8b5b853291f6dbaf0aac661ca2`
  }).promise();
  ctx.body = atom;
}