const Profile = require('./sequelize/profile');
const Joi = require('joi');
const {
  attempt,
  assert,
  Errors
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

exports.createProfile = async (data = {}) => {
  const {
    userId,
    profile,
    provider
  } = data;
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(provider, Errors.ERR_IS_REQUIRED('provider'));
  attempt(profile, {
    id: Joi.number().required(),
    name: Joi.string().required(),
    avatar: Joi.string().required(),
    bio: Joi.any().optional(),
    raw: Joi.string().required(),
  });
  const insertedProfile = await Profile.create({
    userId,
    provider,
    providerId: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    bio: profile.bio,
    raw: profile.raw
  })
  return insertedProfile.toJSON();
}