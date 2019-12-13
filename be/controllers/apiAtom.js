const config = require('../config');
const request = require('request-promise');
const Cache = require('../models/cache');

const type = `${config.serviceKey}_CACHE`;
const key = 'ATOM';

exports.get = async (ctx) => {
  try {
    const cachedAtom = await Cache.pGet(type, key);
    if (cachedAtom) {
      ctx.body = cachedAtom;
    } else {
      const atom = await request({
        uri: `${config.atomUrl}`
      }).promise();
      ctx.body = atom;
    }
  } catch (err) {
    ctx.er(err);
  }
}

exports.sync = async () => {
  const atom = await request({
    uri: `${config.atomUrl}`
  }).promise();
  await Cache.pSetWithExpired(type, key, atom, 60, true);
}