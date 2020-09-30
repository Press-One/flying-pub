const Mixin = require('mixin-node');
const image2base64 = require('image-to-base64');
const util = require('../utils');
const config = require('../config');
const Log = require('./log');
const SSOWalletConfig = require('../SSO/config.pub.wallet');
const Wallet = require('./sequelize/wallet');
const Cache = require('./cache');
const SSO_User = require('../models_SSO/user');
const SSOConfig = require("../SSO/config.pub");
const {
  aesCrypto,
  aesDecrypt
} = util.crypto;
const {
  assert,
  assertFault,
  Errors
} = require('../utils/validator')
const aesKey256 = SSOWalletConfig.encryption.aesKey256;

const mixin = new Mixin({
  client_id: SSOConfig.provider.mixin.clientId,
  aeskey: SSOConfig.provider.mixin.aesKey,
  pin: SSOConfig.provider.mixin.pinCode,
  session_id: SSOConfig.provider.mixin.sessionId,
  privatekey: Buffer.from(SSOConfig.provider.mixin.privateKey, 'utf8')
});

const getNumberByMixinClientId = mixinClientId => {
  let str = '';
  for (const char of mixinClientId) {
    if (/\d/.test(char) && String(Number(str)).length < 6) {
      str += char;
    }
  }
  return Number(str);
}

const aesCryptoWallet = data => {
  const counterInitialValue = getNumberByMixinClientId(data.mixinClientId) + Number(data.mixinPin) + SSOWalletConfig.encryption.salt;
  data.mixinAesKey = aesCrypto(data.mixinAesKey, aesKey256, counterInitialValue);
  data.mixinSessionId = aesCrypto(data.mixinSessionId, aesKey256, counterInitialValue);
  data.mixinPrivateKey = aesCrypto(data.mixinPrivateKey, aesKey256, counterInitialValue);
  data.mixinAccount = aesCrypto(JSON.stringify(data.mixinAccount), aesKey256, counterInitialValue);
  return data;
};

const aesDecryptWallet = data => {
  if (!data.mixinAccount) {
    return data;
  }
  const counterInitialValue = data.version === 1 ? getNumberByMixinClientId(data.mixinClientId) + Number(data.mixinPin) + SSOWalletConfig.encryption.salt : 5;
  data.mixinPin = data.version === 1 ? data.mixinPin : aesDecrypt(data.mixinPin, aesKey256, counterInitialValue);
  data.mixinAesKey = aesDecrypt(data.mixinAesKey, aesKey256, counterInitialValue);
  data.mixinSessionId = aesDecrypt(data.mixinSessionId, aesKey256, counterInitialValue);
  data.mixinPrivateKey = aesDecrypt(data.mixinPrivateKey, aesKey256, counterInitialValue);
  data.mixinAccount = JSON.parse(aesDecrypt(data.mixinAccount, aesKey256, counterInitialValue));
  return data;
};

const getBase64Image = async (url) => {
  const type = 'BASE64_IMAGE';
  const cachedBase64Image = await Cache.pGet(type, url);
  if (cachedBase64Image) {
    return cachedBase64Image;
  }
  const base64 = await image2base64(url);
  await Cache.pSet(type, url, base64);
  return base64;
}

const generateWallet = async nickname => {
  assertFault(nickname, Errors.ERR_IS_REQUIRED('nickname'))
  let mxRaw = await mixin.account.createUser(nickname);
  assertFault(
    mxRaw && mxRaw.data && mxRaw.publickey && mxRaw.privatekey,
    Errors.ERR_WALLET_FAIL_TO_CREATE_WALLET
  );
  const pin = String(Math.random()).substr(2, 6);
  assertFault(
    pin && pin.length === 6,
    Errors.ERR_WALLET_WRONG_PIN
  );
  const updateOptions = {
    client_id: mxRaw.data.user_id,
    session_id: mxRaw.data.session_id,
    privatekey: mxRaw.privatekey
  };
  const pnRaw = await mixin.account.updatePin(
    '', pin, mxRaw.data.aeskeybase64, updateOptions
  );
  assertFault(
    pnRaw && pnRaw.data && pnRaw.data.has_pin,
    Errors.ERR_WALLET_FAIL_TO_UPDATE_PIN
  );
  mxRaw.data.has_pin = true;
  const wallet = {
    mixinClientId: mxRaw.data.user_id,
    mixinAesKey: mxRaw.data.aeskeybase64,
    mixinPin: pin,
    mixinSessionId: mxRaw.data.session_id,
    mixinPrivateKey: mxRaw.privatekey,
    mixinAccount: mxRaw,
    version: '1',
  };
  const logo = config.logo || config.settings['site.logo'];
  assert(logo, Errors.ERR_IS_REQUIRED('logo'));
  const logoBase64 = await getBase64Image(logo);
  let mxProfileRaw = await mixin.account.updateProfile({
    avatar_base64: logoBase64
  }, updateOptions);
  assertFault(mxProfileRaw, Errors.ERR_WALLET_FAIL_TO_UPDATE_AVATAR);

  return aesCryptoWallet(wallet);
};

const getByUserId = async userId => {
  const wallet = await Wallet.findOne({
    where: {
      userId
    }
  });
  if (!wallet) {
    return null;
  }
  const walletJson = wallet.toJSON()
  walletJson.version = Number(walletJson.version);
  return walletJson;
}

exports.exists = async userId => {
  userId = await SSO_User.tryGetUserIdByReaderUserId(userId);
  const wallet = await getByUserId(userId);
  return !!wallet;
}

exports.getMixinClientIdByUserId = async userId => {
  userId = await SSO_User.tryGetUserIdByReaderUserId(userId);
  const wallet = await getByUserId(userId);
  return wallet ? wallet.mixinClientId : null;
}

const getCustomPinByUserId = async userId => {
  userId = await SSO_User.tryGetUserIdByReaderUserId(userId);
  const wallet = await getByUserId(userId);
  return wallet ? wallet.customPin : null;
}
exports.getCustomPinByUserId = getCustomPinByUserId;

exports.getRawByUserId = async userId => {
  userId = await SSO_User.tryGetUserIdByReaderUserId(userId);
  const wallet = await getByUserId(userId);
  return wallet ? aesDecryptWallet(wallet) : null;
}

exports.tryCreateWallet = async user => {
  assertFault(user, Errors.ERR_IS_REQUIRED(user));
  let userId;
  if (user.version === 1) {
    userId = user.id;
  } else {
    userId = await SSO_User.tryGetUserIdByReaderUserId(user.id);
  }
  const existedWallet = await getByUserId(userId);

  if (existedWallet) {
    return true;
  }

  if (user.version !== 1) {
    Log.createAnonymity('钱包创建异常', `${user.id} ${user.nickname} version 为 0，竟然不存在钱包 ！！！`);
  }

  const walletData = await generateWallet(user.nickname);
  const wallet = await Wallet.create({
    userId,
    ...walletData
  });

  return wallet;
};

exports.updateCustomPin = async (userId, pinCode, options = {}) => {
  userId = await SSO_User.tryGetUserIdByReaderUserId(userId);
  assert(userId, Errors.ERR_IS_REQUIRED('userId'))
  assert(pinCode, Errors.ERR_IS_REQUIRED('pinCode'))
  const customPin = await getCustomPinByUserId(userId);
  if (customPin) {
    const {
      oldPinCode
    } = options;
    assert(oldPinCode, Errors.ERR_IS_REQUIRED('oldPinCode'))
    const cryptoOldPin = aesCrypto(oldPinCode, aesKey256);
    assert(customPin === cryptoOldPin, Errors.ERR_WALLET_MISMATCH_PIN);
  }
  const cryptoPin = aesCrypto(pinCode, aesKey256);
  await Wallet.update({
    customPin: cryptoPin,
  }, {
    where: {
      userId
    }
  });
  return true;
}

exports.validatePin = async (userId, pinCode) => {
  userId = await SSO_User.tryGetUserIdByReaderUserId(userId);
  assert(userId, Errors.ERR_IS_REQUIRED('userId'))
  assert(pinCode, Errors.ERR_IS_REQUIRED('pinCode'))
  const customPin = await getCustomPinByUserId(userId);
  if (customPin) {
    const cryptoPin = aesCrypto(pinCode, aesKey256);
    return customPin === cryptoPin;
  }
  return false;
}