const User = require("./sequelize/user");
const Profile = require("./profile");
const PrsUtil = require("prs-utility");
const util = require("../utils");
const config = require("../config");
const Wallet = require("./wallet");
const Author = require("./author");
const SSO_User = require('../models_SSO/user');

const {
  assert,
  Errors
} = require("../utils/validator");

const DEFAULT_AVATAR = "https://static.press.one/pub/avatar.png";
const packUser = async (user, options = {}) => {
  assert(user, Errors.ERR_IS_REQUIRED("user"));

  const isNewVersionUser = user.version === 1;
  const isSharedWithPubUser = user.version !== 1;
  const {
    withKeys
  } = options;

  const derivedUser = {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    bio: user.bio,
    version: user.version || 0
  };

  // 新用户
  if (isNewVersionUser) {
    derivedUser.address = user.address;
    derivedUser.mixinWalletClientId = await Wallet.getMixinClientIdByUserId(
      user.id
    );
    if (withKeys) {
      derivedUser.privateKey = util.crypto.aesDecrypt(
        user.aesEncryptedHexOfPrivateKey,
        config.encryption.aesKey256
      );
    }
  }

  // 旧用户，需要使用 pub user 的一些数据
  if (isSharedWithPubUser) {
    const pubUser = await SSO_User.getByReaderUserId(user.id, {
      withKeys
    });
    assert(pubUser, Errors.ERR_NOT_FOUND("pubUser"));
    derivedUser.address = pubUser.address;
    derivedUser.mixinWalletClientId = await Wallet.getMixinClientIdByUserId(
      user.id
    );
    if (withKeys) {
      derivedUser.privateKey = pubUser.privateKey;
    }
  }

  const mixinProfile = await Profile.getByUserIdAndProvider(user.id, "mixin");
  if (mixinProfile) {
    derivedUser.mixinAccount = packMixinAccount(mixinProfile.raw);
  } else {
    derivedUser.mixinAccount = null;
  }

  return derivedUser;
};

const packMixinAccount = (mixinAccountRaw) => {
  const json = JSON.parse(mixinAccountRaw);
  return {
    user_id: json.user_id,
    full_name: json.full_name,
    avatar_url: json.avatar_url || DEFAULT_AVATAR,
    identity_number: json.identity_number,
  };
};
const generateKey = () => {
  const {
    privateKey,
    publicKey,
    address
  } = PrsUtil.createKeyPair({
    dump: true,
  });
  const aesEncryptedHexOfPrivateKey = util.crypto.aesCrypto(
    privateKey,
    config.encryption.aesKey256
  );
  return {
    aesEncryptedHexOfPrivateKey,
    publicKey,
    address,
  };
};

exports.create = async (data) => {
  const {
    nickname,
    bio,
    avatar,
    mixinAccountRaw = null
  } = data;
  const {
    aesEncryptedHexOfPrivateKey,
    publicKey,
    address
  } = generateKey();

  assert(data, Errors.ERR_IS_REQUIRED("data"));
  assert(nickname, Errors.ERR_IS_REQUIRED("nickname"));
  assert(avatar, Errors.ERR_IS_REQUIRED("avatar"));
  assert(
    aesEncryptedHexOfPrivateKey,
    Errors.ERR_IS_REQUIRED("aesEncryptedHexOfPrivateKey")
  );
  assert(publicKey, Errors.ERR_IS_REQUIRED("publicKey"));
  assert(address, Errors.ERR_IS_REQUIRED("address"));

  const user = await User.create({
    nickname,
    bio,
    avatar,
    mixinAccountRaw,
    aesEncryptedHexOfPrivateKey,
    publicKey,
    address,
    version: 1
  });

  return packUser(user.toJSON());
};

exports.update = async (userId, data) => {
  assert(userId, Errors.ERR_IS_REQUIRED("userId"));
  assert(data, Errors.ERR_IS_REQUIRED("data"));

  await User.update(data, {
    where: {
      id: userId,
    },
  });

  try {
    const user = await exports.get(userId);
    Author.upsert(user.address, {
      name: user.nickname || '',
      avatar: user.avatar || '',
      bio: user.bio || '',
    });
  } catch (err) {
    console.log(err);
  }

  return true;
};

exports.get = async (id, options) => {
  return await get({
      id,
    },
    options
  );
};

exports.getByAddress = async (address, options) => {
  const userId = await SSO_User.getReaderIdByAddress(address);
  if (userId) {
    return await get({
      id: userId,
    }, options);
  }
  return await get({
    address,
  }, options);
};

const get = async (query = {}, options = {}) => {
  const {
    withKeys
  } = options;
  const user = await User.findOne({
    where: query,
  });
  if (!user) {
    return null;
  }
  const derivedUser = await packUser(user.toJSON(), {
    withKeys,
  });
  return derivedUser;
};