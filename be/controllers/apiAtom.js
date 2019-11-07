const config = require('../config');
const request = require('request-promise');

exports.get = async (ctx) => {
  const atom = await request({
    uri: `https://xue-posts.press.one/output/${config.topicAddress}`
  }).promise();
  ctx.body = atom;
}