const Profile = require('./sequelize/profile');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const {
  Joi,
  attempt,
  assert,
  Errors
} = require('../models/validator');

exports.get = async (provider, providerId) => {
  assert(provider, Errors.ERR_IS_REQUIRED('provider'));
  assert(providerId, Errors.ERR_IS_REQUIRED('providerId'));

  const profile = await Profile.findOne({
    where: {
      provider,
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

exports.getByMixinAccountId = async mixinAccountId => {
  const profile = await Profile.findOne({
    where: {
      raw: {
        [Op.like]: `%"user_id":"${mixinAccountId}%`
      }
    }
  });
  if (!profile) {
    return null;
  }
  return profile ? profile.toJSON() : null;
}

exports.isExist = async (provider, providerId) => {
  return !!await exports.get(provider, providerId);
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

exports.update = async (userId, data) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  attempt(data, {
    name: Joi.string().required(),
    avatar: Joi.string().required(),
  });
  await Profile.update({
    name: data.name,
    avatar: data.avatar,
  }, {
    where: {
      userId
    }
  })
  return true;
}


exports.countNoPhoneProfile = async () => {
  const count = await Profile.count({
    where: {
      provider: 'mixin',
      raw: {
        [Op.and]: {
          [Op.or]: [{
              [Op.like]: `%"phone":""%`
            },
            {
              [Op.notLike]: `%"phone":%`
            },
          ],
          [Op.notLike]: `%"no_in_group":%`
        }
      }
    },
  });
  return count;
}

exports.listNoPhoneProfile = async (options = {}) => {
  const {
    offset = 0, limit = 10
  } = options;
  const profiles = await Profile.findAll({
    where: {
      provider: 'mixin',
      raw: {
        [Op.and]: {
          [Op.or]: [{
              [Op.like]: `%"phone":""%`
            },
            {
              [Op.notLike]: `%"phone":%`
            },
          ],
          [Op.notLike]: `%"no_in_group":%`
        }
      }
    },
    offset,
    limit,
    order: [
      ['id', 'ASC']
    ]
  });
  return profiles.map(profile => profile.toJSON());
}

exports.addPhoneToProfile = async (id, phone) => {
  assert(id, Errors.ERR_IS_REQUIRED('id'));
  assert(phone, Errors.ERR_IS_REQUIRED('phone'));
  const profile = await Profile.findOne({
    where: {
      id,
    }
  });
  const {
    raw
  } = profile.toJSON();
  const jsonRaw = JSON.parse(raw);
  jsonRaw.phone = phone;
  await Profile.update({
    raw: JSON.stringify(jsonRaw)
  }, {
    where: {
      id
    }
  });
}

exports.addNoInGroupToProfile = async id => {
  assert(id, Errors.ERR_IS_REQUIRED('id'));
  const profile = await Profile.findOne({
    where: {
      id,
    }
  });
  const {
    raw
  } = profile.toJSON();
  const jsonRaw = JSON.parse(raw);
  jsonRaw.no_in_group = true;
  await Profile.update({
    raw: JSON.stringify(jsonRaw)
  }, {
    where: {
      id
    }
  });
}