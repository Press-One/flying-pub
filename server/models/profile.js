const Profile = require('./sequelize/profile');
const argon2 = require('argon2');
const Joi = require('joi');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const {
  attempt,
  assert,
  throws,
  Errors
} = require('../utils/validator');

const toJSON = (profile) => {
  if (profile) { // NOTE: remove `password` field from `profile object`
    const newProfile = profile.toJSON();
    delete newProfile.password;
    return newProfile;
  }
  return null;
};

exports.get = async (provider, providerId) => {
  assert(provider, Errors.ERR_IS_REQUIRED('provider'));
  assert(providerId, Errors.ERR_IS_REQUIRED('providerId'));

  const profile = await Profile.findOne({
    where: {
      provider,
      providerId
    }
  });
  return toJSON(profile);
}

exports.getByUserId = async userId => {
  // user can have many profile
  const profiles = await Profile.findAll({
    attributes: {
      exclude: ['password']
    },
    where: {
      userId
    }
  });
  if (profiles === null) {
    return profiles;
  }
  return profiles.map((profile) => toJSON(profile));
}

const getByUserIdAndProvider = async (userId, provider, include_password = false) => {
  const profile = await Profile.findOne({
    where: {
      userId,
      provider
    }
  });
  if (profile === null) {
    return profile;
  }
  return include_password ? profile.toJSON() : toJSON(profile);
}
exports.getByUserIdAndProvider = getByUserIdAndProvider;

exports.getByMixinAccountId = async mixinAccountId => {
  let profile = await Profile.findOne({
    where: {
      raw: {
        [Op.like]: `%"user_id":"${mixinAccountId}%`
      }
    }
  });
  return toJSON(profile);
}

exports.isExist = async (provider, providerId) => {
  return !!await exports.get(provider, providerId);
}

exports.createProfile = async (data = {}) => {
  const {
    userId,
    profile,
  } = data;
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(profile, Errors.ERR_IS_REQUIRED('profile'));

  if (Object.prototype.hasOwnProperty.call(profile, 'nickname')) {
    delete profile.nickname;
  }
  attempt(profile, {
    provider: Joi.string().required(),
    providerId: Joi.number().required(),
    name: Joi.string().required(),
    avatar: Joi.string().required(),
    bio: Joi.any().optional(),
    raw: Joi.string().required(),
    password: Joi.string().allow(null).optional(),
  });

  // NOTE: only can create one profile for each provider
  if (await getByUserIdAndProvider(userId, profile.provider)) {
    throws(Errors.ERR_IS_DUPLICATED('profile'));
  }

  const insertedProfile = await Profile.create({
    userId,
    ...profile,
  })
  return toJSON(insertedProfile);
}

exports.update = async (userId, data) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  if (Object.prototype.hasOwnProperty.call(data, 'nickname')) {
    delete data.nickname;
  }
  attempt(data, {
    provider: Joi.string().required(),
    providerId: Joi.number().required(),
    name: Joi.string().required(),
    avatar: Joi.string().required(),
    bio: Joi.any().optional(),
    password: Joi.string().allow(null).optional(),
    raw: Joi.string().optional(),
  });
  await Profile.update(data, {
    where: {
      userId,
      provider: data.provider,
      providerId: data.providerId,
    }
  });
  return true;
}

const hashPassword = async (password) => {
  assert(password, Errors.ERR_IS_REQUIRED('password'));
  return await argon2.hash(password);
}

const verifyPassword = async (_hashPassword, password) => {
  assert(_hashPassword, Errors.ERR_IS_REQUIRED('hashPassword'));
  assert(password, Errors.ERR_IS_REQUIRED('password'));

  return await argon2.verify(_hashPassword, password);
}

const verifyUserPassword = async (userId, password, provider) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(password, Errors.ERR_IS_REQUIRED('password'));
  assert(['phone', ].includes(provider), Errors.ERR_IS_REQUIRED('provider'));

  const profile = await getByUserIdAndProvider(userId, provider, true);
  assert(profile, Errors.ERR_NOT_FOUND(`profile by ${provider}`));
  return await verifyPassword(profile.password, password);
}
exports.verifyUserPassword = verifyUserPassword

const setPassword = async (userId, password, provider) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(password, Errors.ERR_IS_REQUIRED('password'));
  assert(['phone', ].includes(provider), Errors.ERR_IS_REQUIRED('provider'));

  const _hashPassword = await hashPassword(password);

  await Profile.update({
    password: _hashPassword
  }, {
    where: {
      userId,
      provider
    }
  });

  return true;
}
exports.setPassword = setPassword;

exports.updatePasswordWithOldPassword = async (userId, oldPassword, password, provider) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(oldPassword, Errors.ERR_IS_REQUIRED('oldPassword'));
  assert(password, Errors.ERR_IS_REQUIRED('password'));
  assert(['phone', ].includes(provider), Errors.ERR_IS_REQUIRED('provider'));

  if (!await verifyUserPassword(userId, oldPassword, provider)) {
    throws(Errors.ERR_IS_INVALID('oldPassword'));
  }

  return setPassword(userId, password, provider);
}

exports.getSyncProfileData = (profile) => {
  assert(profile, Errors.ERR_IS_REQUIRED('profile'));
  return {
    provider: profile.provider,
    providerId: profile.providerId,
    name: profile.name,
    avatar: profile.avatar,
    bio: profile.bio,
    password: profile.password,
    raw: profile.raw,
  };
}