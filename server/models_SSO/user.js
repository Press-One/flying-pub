const SSOConfig = require('../SSO/config.pub');
const User = require('./sequelize/user');
const ReaderProfile = require('../models/profile');
const util = require('../utils');
const {
  assert,
  Errors
} = require('../utils/validator');

const packUser = (user, options = {}) => {
  assert(user, Errors.ERR_IS_REQUIRED('user'));

  const derivedUser = {
    id: user.id,
    address: user.address,
    provider: 'mixin',
    providerId: user.providerId,
  };

  const {
    withKeys
  } = options;

  if (withKeys) {
    derivedUser.privateKey = util.crypto.aesDecrypt(user.aesEncryptedHexOfPrivateKey, SSOConfig.encryption.aesKey256);
  } else {
    delete derivedUser.publicKey;
  }
  delete derivedUser.aesEncryptedHexOfPrivateKey;
  return derivedUser;
}

exports.getByReaderUserId = async (readerUserId, options = {}) => {
  const userId = await getUserIdByReaderUserId(readerUserId);
  if (!userId) {
    return null;
  }
  const user = await get({
    id: userId
  }, options);
  return user;
}

exports.tryGetReaderIdByAddress = async address => {
  assert(address, Errors.ERR_IS_REQUIRED('address'));
  const user = await get({
    address
  });
  if (!user) {
    return null;
  }
  const mixinProfile = await ReaderProfile.get('mixin', user.providerId);
  if (!mixinProfile) {
    return null;
  }
  return mixinProfile.userId;
}

const getUserIdByReaderUserId = async (readerUserId) => {
  assert(readerUserId, Errors.ERR_NOT_FOUND('readerUserId'))
  const mixinProfile = await ReaderProfile.getByUserIdAndProvider(readerUserId, 'mixin');
  if (!mixinProfile) {
    return null;
  }
  const {
    provider,
    providerId
  } = mixinProfile;
  const user = await get({
    provider,
    providerId
  });
  if (!user) {
    return null;
  }
  const userId = user.id;
  return userId;
}

const get = async (query = {}, options = {}) => {
  const {
    withKeys,
  } = options;
  const user = await User.findOne({
    where: query
  });
  if (!user) {
    return null;
  }
  const derivedUser = packUser(user.toJSON(), {
    withKeys,
  });
  return derivedUser;
}