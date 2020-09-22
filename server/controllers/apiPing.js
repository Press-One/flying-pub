const { getRedis } = require('../models/cache');

const pingRedis = () => {
  const redis = getRedis();
  if (!redis) {
    return;
  }
  return new Promise((resolve, reject) => {
    redis.ping((err, res) => {
      if (err) {
        err.type = 'Redis';
        reject(err);
        return;
      }
      if (res !== 'PONG') {
        const err = new Error(res);
        err.type = 'Redis';
        reject(err);
      }
      resolve();
    });
  });
};

exports.ping = async (ctx) => {
  try {
    await pingRedis();
    ctx.body = 'pong';
  } catch (err) {
    ctx.status = 400;
    if (err.type) {
      ctx.message = `[${err.type}] ${err.message}`;
    } else {
      ctx.message = err.message;
    }
  }
};

const Profile = require('../models/profile');
const { assert, Errors } = require('../models/validator');

exports.listNoPhoneProfile = async (ctx) => {
  const { offset = 0, limit = 10 } = ctx.query;
  const profiles = await Profile.listNoPhoneProfile({
    offset,
    limit,
  });
  const count = await Profile.countNoPhoneProfile();
  ctx.body = {
    total: count,
    profiles,
  };
};

exports.addPhoneToProfile = async (ctx) => {
  const { profileId, phone } = ctx.request.body.payload;
  assert(phone, Errors.ERR_IS_REQUIRED('phone'));
  await Profile.addPhoneToProfile(profileId, phone);
  ctx.body = true;
};

exports.addNoInGroupToProfile = async (ctx) => {
  const { profileId } = ctx.request.body.payload;
  assert(profileId, Errors.ERR_IS_REQUIRED('profileId'));
  await Profile.addNoInGroupToProfile(profileId);
  ctx.body = true;
};
