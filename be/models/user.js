const User = require('./sequelize/user');
const Profile = require('./profile');
const PrsUtil = require('prs-utility');
const util = require('../utils');
const config = require('../config');
const Wallet = require('./wallet');
const {
  assert,
  Errors
} = require('./validator')

const packUser = (user, options = {}) => {
  assert(user, Errors.ERR_IS_REQUIRED('user'));
  const {
    withKeys,
    withWallet
  } = options;
  if (withKeys) {
    user.privateKey = util.crypto.aesDecrypt(user.aesEncryptedHexOfPrivateKey, config.aesKey256);
    delete user.aesEncryptedHexOfPrivateKey;
  } else {
    delete user.publicKey;
    delete user.aesEncryptedHexOfPrivateKey;
  }
  let packedUser = user;
  if (withWallet) {
    packedUser = {
      ...packedUser,
      ...Wallet.aesDecryptWallet(packedUser)
    }
  } else if (user.mixinAccount) {
    delete user.mixinAesKey;
    delete user.mixinPin;
    delete user.mixinSessionId;
    delete user.mixinPrivateKey;
    delete user.mixinAccount;
  }
  return packedUser;
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

  let user = await User.create({
    providerId,
    provider,
    aesEncryptedHexOfPrivateKey,
    publicKey,
    address,
  });

  user = await tryInitWallet(user.toJSON().id);

  return user;
}

const update = async (userId, data) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(data, Errors.ERR_IS_REQUIRED('data'));

  await User.update(data, {
    where: {
      id: userId
    }
  });

  return true;
}

const tryInitWallet = async (userId) => {
  assert(userId, Errors.ERR_IS_INVALID('userId'));

  let user = await exports.get(userId, {
    withKeys: true
  });
  assert(user, Errors.ERR_NOT_FOUND('user'));

  if (user.mixinClientId) {
    console.log(`${userId}： 钱包已存在，无需初始化`);
    return user;
  }

  const wallet = await Wallet.createWallet(user);
  await update(userId, wallet);
  user = await exports.get(userId, {
    withKeys: true
  });

  return user;
};

exports.hasWallet = async (userId) => {
  const user = await exports.get(userId, {
    withWallet: true
  });
  return !!user.mixinClientId;
};

exports.get = async (id, options = {}) => {
  const {
    withWallet,
    withKeys,
    withProfile,
  } = options;
  const promises = [
    User.findOne({
      where: {
        id
      }
    }),
  ];
  if (withProfile) {
    promises.push(Profile.getByUserId(id));
  }
  const res = await Promise.all(promises);
  if (!res[0]) {
    return null;
  }
  if (withProfile && !res[1]) {
    return null;
  }
  const user = packUser(res[0].toJSON(), {
    withWallet,
    withKeys
  });
  return withProfile ? {
    ...user,
    ...packProfile(res[1])
  } : user;
}