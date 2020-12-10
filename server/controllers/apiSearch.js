const config = require('../config');
const Log = require('../models/log');
const request = require('request-promise');

exports.get = async ctx => {
  const userId = ctx.verification && ctx.verification.user.id;
  try {
    const res = await request({
      uri: `${config.search.searchUrl}?${ctx.querystring}`,
      json: true,
      timeout: 10000
    }).promise();
    if (userId) {
      Log.create(userId, `【搜索】${ctx.query.q}`);
    }
    ctx.body = res;
  } catch(e) {}
};

