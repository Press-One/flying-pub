const config = require('../config');
const request = require('request-promise');

exports.get = async (ctx) => {
  try {
    const atom = await request({
      uri: `${config.atomUrl}`
    }).promise();
    ctx.body = atom;
  } catch (err) {
    ctx.er(err);
  }
}