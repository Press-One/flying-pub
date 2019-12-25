const config = require('../config');
const request = require('request-promise');
const {
  assert,
  Errors
} = require('../models/validator');
const Profile = require('../models/profile');
const {
  checkPermission
} = require('../models/api');
const Cache = require('../models/cache');
const type = `${config.serviceKey}_CACHE`;
const key = 'ATOM';

exports.get = async (ctx) => {
  if (config.auth.enabledChecking) {
    assert(ctx.verification, Errors.ERR_NO_PERMISSION, 401);
    const {
      user
    } = ctx.verification;
    const profile = await Profile.getByUserId(user.id);
    const hasPermission = await checkPermission(profile.provider, profile);
    assert(hasPermission, Errors.ERR_NO_PERMISSION, 401);
  }
  try {
    const cachedAtom = await Cache.pGet(type, key);
    if (cachedAtom) {
      ctx.body = cachedAtom;
    } else {
      const atom = await request({
        uri: `${config.feedUrl}`
      }).promise();
      ctx.body = atom;
    }
  } catch (err) {
    ctx.er(err);
  }
}

exports.sync = async () => {
  const atom = await request({
    uri: `${config.feedUrl}`
  }).promise();
  await Cache.pSetWithExpired(type, key, atom, 60, true);
}