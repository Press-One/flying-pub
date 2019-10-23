const config = require('../config');
const request = require('request-promise');

exports.get = async (ctx) => {
  const atom = await request({
    uri: `https://xue-posts.xue.cn/output/${config.topicAddress}`
  }).promise();
  ctx.set('Content-Type', "application/atom+xml; charset=utf-8");
  ctx.body = atom;
}