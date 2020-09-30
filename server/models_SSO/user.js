const SSOConfig = require('../SSO/config.pub');
const User = require('./sequelize/user');
const ReaderUserTable = require('../models/sequelize/user');
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

const getIsNewVersionUser = async readerUserId => {
  const user = await ReaderUserTable.findOne({
    where: {
      id: readerUserId,
      version: 1
    }
  });
  return !!user;
}

exports.getByReaderUserId = async (readerUserId, options = {}) => {
  const userId = await getUserIdByReaderUserId(readerUserId);
  const user = await get({
    id: userId
  }, options);
  return user;
}

exports.getReaderIdByAddress = async address => {
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

exports.tryGetReaderIdByUserId = async userId => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  const user = await get({
    id: userId
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

exports.tryGetUserIdByReaderUserId = async (readerUserId) => {
  const isNewVersionUser = await getIsNewVersionUser(readerUserId);
  if (isNewVersionUser) {
    return readerUserId;
  }
  return await getUserIdByReaderUserId(readerUserId);
}

const getUserIdByReaderUserId = async (readerUserId) => {
  assert(readerUserId, Errors.ERR_NOT_FOUND('readerUserId'))
  const mixinProfile = await ReaderProfile.getByUserIdAndProvider(readerUserId, 'mixin');
  assert(mixinProfile, Errors.ERR_NOT_FOUND('mixinProfile'))
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
  assert(user, Errors.ERR_NOT_FOUND('user'));
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