const User = require("./sequelize/user");
const Profile = require("./profile");
const PrsUtil = require("prs-utility");
const util = require("../utils");
const config = require("../config");
const Author = require("./author");
const Wallet = require("./wallet");
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

  // 旧用户，需要使用 pub user 的一些数据
  let foundPubUser = false;
  if (isSharedWithPubUser) {
    const pubUser = await SSO_User.getByReaderUserId(user.id, {
      withKeys
    });
    if (pubUser) {
      foundPubUser = true;
      derivedUser.address = pubUser.address;
      if (withKeys) {
        derivedUser.privateKey = pubUser.privateKey;
      }
      derivedUser.SSO = {
        reader: {
          id: user.id,
          address: user.address
        },
        pub: {
          id: pubUser.id,
          address: pubUser.address
        }
      }
    }
  }

  // 新用户
  if (isNewVersionUser || !foundPubUser) {
    derivedUser.address = user.address;
    if (withKeys) {
      derivedUser.privateKey = util.crypto.aesDecrypt(
        user.aesEncryptedHexOfPrivateKey,
        config.encryption.aesKey256
      );
    }
  }

  return derivedUser;
};

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
    if (data.nickname) {
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
  const userId = await SSO_User.tryGetReaderIdByAddress(address);
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