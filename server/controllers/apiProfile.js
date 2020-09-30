'use strict';

const Profile = require('../models/profile');

exports.get = async (ctx) => {
  const {
    user,
  } = ctx.verification;

  const profiles = await Profile.getByUserId(user.id);
  ctx.body = profiles;
}