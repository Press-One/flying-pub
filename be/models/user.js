const User = require('./sequelize/user');
const Profile = require('./profile');
const PrsUtil = require('prs-utility');
const util = require('../utils');
const config = require('../config');
const {
  assert,
  Errors
} = require('./validator')

const packUser = (user, options = {}) => {
  assert(user, Errors.ERR_IS_REQUIRED('user'));
  const {
    withKeys
  } = options;
  if (withKeys) {
    user.privateKey = util.crypto.aesDecrypt(user.aesEncryptedHexOfPrivateKey, config.aesKey256);
    delete user.aesEncryptedHexOfPrivateKey;
  } else {
    delete user.publicKey;
    delete user.aesEncryptedHexOfPrivateKey;
  }
  return user;
}

const packProfile = profile => ({
  name: profile.name,
  avatar: profile.avatar,
  bio: profile.bio,
})

const generateKey = () => {
  const {
    privateKey,
    publicKey,
    address
  } = PrsUtil.createKeyPair({
    dump: true
  });
  const aesEncryptedHexOfPrivateKey = util.crypto.aesCrypto(privateKey, config.aesKey256);
  return {
    aesEncryptedHexOfPrivateKey,
    publicKey,
    address,
  }
}

exports.create = async (data) => {
  const {
    provider,
    providerId
  } = data;
  const {
    aesEncryptedHexOfPrivateKey,
    publicKey,
    address
  } = generateKey();

  assert(data, Errors.ERR_IS_REQUIRED('data'));
  assert(provider, Errors.ERR_IS_REQUIRED('provider'));
  assert(providerId, Errors.ERR_IS_REQUIRED('providerId'));
  assert(aesEncryptedHexOfPrivateKey, Errors.ERR_IS_REQUIRED('aesEncryptedHexOfPrivateKey'));
  assert(publicKey, Errors.ERR_IS_REQUIRED('publicKey'));
  assert(address, Errors.ERR_IS_REQUIRED('address'));

  const user = await User.create({
    providerId,
    provider,
    aesEncryptedHexOfPrivateKey,
    publicKey,
    address,
  });

  return packUser(user.toJSON());
}

exports.get = async (id, options = {}) => {
  const [user, profile] = await Promise.all([
    User.findOne({
      where: {
        id
      }
    }),
    Profile.getByUserId(id),
  ]);
  if (!user || !profile) {
    return null;
  }
  return {
    ...packUser(user.toJSON(), options),
    ...packProfile(profile)
  }
}