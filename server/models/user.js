const User = require("./sequelize/user");
const Profile = require("./profile");
const util = require("../utils");
const config = require("../config");
const Wallet = require("./wallet");
const prsUtil = require('prs-utility');

const {
  assert,
  Errors
} = require("../utils/validator");

const DEFAULT_AVATAR = "https://static-assets.xue.cn/images/435d111.jpg";
const packUser = async (user, options = {}) => {
  assert(user, Errors.ERR_IS_REQUIRED("user"));

  const {
    withKeys
  } = options;

  const derivedUser = {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    cover: user.cover,
    bio: user.bio,
    privateSubscriptionEnabled: user.privateSubscriptionEnabled,
    privateContributionEnabled: user.privateContributionEnabled
  };

  derivedUser.address = user.address;
  if (withKeys) {
    derivedUser.privateKey = util.crypto.aesDecrypt(
      user.aesEncryptedHexOfPrivateKey,
      config.encryption.aesKey256
    );
  }

  return derivedUser;
};
exports.packUser = packUser;

exports.getMixinAccount = async userId => {
  assert(userId, Errors.ERR_IS_REQUIRED("userId"));
  const mixinProfile = await Profile.getByUserIdAndProvider(userId, "mixin");
  if (mixinProfile) {
    return packMixinAccount(mixinProfile.raw);
  } else {
    return null;
  }
}

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
  } = prsUtil.createKeyPair({
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
  } = await generateKey();

  assert(data, Errors.ERR_IS_REQUIRED("data"));
  assert(nickname, Errors.ERR_IS_REQUIRED("nickname"));
  assert(avatar, Errors.ERR_IS_REQUIRED("avatar"));
  assert(
    aesEncryptedHexOfPrivateKey,
    Errors.ERR_IS_REQUIRED("aesEncryptedHexOfPrivateKey")
  );
  assert(publicKey, Errors.ERR_IS_REQUIRED("publicKey"));

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
    if (data.nickname) {
      const user = await exports.get(userId);
      await Wallet.updateNickname(user.address, user.nickname);
    }
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
  return await get({
    address,
  }, options);
};

const get = async (query = {}, options = {}) => {
  const {
    raw,
    withKeys,
    returnRaw
  } = options;
  const user = await User.findOne({
    where: query,
  });
  if (!user) {
    return null;
  }

  if (raw) {
    return user;
  }

  const derivedUser = await packUser(user.toJSON(), {
    withKeys,
  });

  if (returnRaw) {
    return { sequelizeUser: user, user: derivedUser }
  }

  return derivedUser;
};
