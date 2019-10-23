const User = require('./user');
const Profile = require('./sequelize/profile');
const Errors = require('../models/validator/errors');
const Joi = require('joi');
const {
  attempt,
  assert
} = require('../models/validator');

exports.get = async providerId => {
  const profile = await Profile.findOne({
    where: {
      providerId
    }
  });
  return profile ? profile.toJSON() : null;
}

exports.getByUserId = async userId => {
  const profile = await Profile.findOne({
    where: {
      userId
    }
  });
  return profile ? profile.toJSON() : null;
}

exports.isExist = async (providerId, options = {}) => {
  const {
    provider
  } = options;
  assert(provider, Errors.ERR_IS_REQUIRED('provider'));
  assert(providerId, Errors.ERR_IS_REQUIRED('providerId'));

  const profile = await Profile.findOne({
    where: {
      provider,
      providerId
    }
  });
  return !!profile;
}

exports.createProfile = async (profile, options = {}) => {
  const {
    provider
  } = options;
  assert(provider, Errors.ERR_IS_REQUIRED('provider'));
  attempt(profile, {
    id: Joi.number().required(),
    name: Joi.string().required(),
    avatar: Joi.string().required(),
    bio: Joi.any().optional(),
    raw: Joi.string().required(),
  });
  const user = await User.create({
    providerId: profile.id,
    provider
  });
  assert(user, Errors.ERR_IS_REQUIRED('user'));
  const insertedProfile = await Profile.create({
    userId: user.id,
    provider,
    providerId: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    bio: profile.bio,
    raw: profile.raw
  })
  return insertedProfile.toJSON();
}