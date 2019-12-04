const Mixin = require('mixin-node');
const util = require('../utils');
const config = require('../config');
const walletConfig = require('../config.wallet');
const Wallet = require('./sequelize/wallet');
const User = require('./user');
const {
  aesCrypto,
  aesDecrypt
} = util.crypto;
const {
  assert,
  assertFault,
  Errors
} = require('./validator')

const mixin = new Mixin({
  client_id: config.mixin.clientId,
  aeskey: config.mixin.aesKey,
  pin: config.mixin.pinCode,
  session_id: config.mixin.sessionId,
  privatekey: config.mixin.privateKeyFilePath
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
  const counterInitialValue = getNumberByMixinClientId(data.mixinClientId) + Number(data.mixinPin) + walletConfig.salt;
  data.mixinAesKey = aesCrypto(data.mixinAesKey, config.aesKey256, counterInitialValue);
  data.mixinSessionId = aesCrypto(data.mixinSessionId, config.aesKey256, counterInitialValue);
  data.mixinPrivateKey = aesCrypto(data.mixinPrivateKey, config.aesKey256, counterInitialValue);
  data.mixinAccount = aesCrypto(JSON.stringify(data.mixinAccount), config.aesKey256, counterInitialValue);
  return data;
};

const aesDecryptWallet = data => {
  if (!data.mixinAccount) {
    return data;
  }
  const counterInitialValue = data.version === 1 ? getNumberByMixinClientId(data.mixinClientId) + Number(data.mixinPin) + walletConfig.salt : 5;
  data.mixinPin = data.version === 1 ? data.mixinPin : aesDecrypt(data.mixinPin, config.aesKey256, counterInitialValue);
  data.mixinAesKey = aesDecrypt(data.mixinAesKey, config.aesKey256, counterInitialValue);
  data.mixinSessionId = aesDecrypt(data.mixinSessionId, config.aesKey256, counterInitialValue);
  data.mixinPrivateKey = aesDecrypt(data.mixinPrivateKey, config.aesKey256, counterInitialValue);
  data.mixinAccount = JSON.parse(aesDecrypt(data.mixinAccount, config.aesKey256, counterInitialValue));
  return data;
};

const generateWallet = async userId => {
  assertFault(userId, Errors.ERR_IS_REQUIRED(userId));
  const user = await User.get(userId, {
    withProfile: true
  });
  assertFault(user, Errors.ERR_NOT_FOUND(user));
  assertFault(user.name, Errors.ERR_NOT_FOUND('user.name'))
  let mxRaw = await mixin.account.createUser(user.name);
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
    version: 1,
  };
  // 更新 1px 的透明图片
  let mxProfileRaw = await mixin.account.updateProfile({
    avatar_base64: config.logoBase64
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
  return wallet ? wallet.toJSON() : null;
}

exports.exists = async userId => {
  const wallet = await getByUserId(userId);
  return !!wallet;
}

exports.getMixinClientIdByUserId = async userId => {
  const wallet = await getByUserId(userId);
  return wallet ? wallet.mixinClientId : null;
}

const getCustomPinByUserId = async userId => {
  const wallet = await getByUserId(userId);
  return wallet ? wallet.customPin : null;
}
exports.getCustomPinByUserId = getCustomPinByUserId;

exports.getRawByUserId = async userId => {
  const wallet = await getByUserId(userId);
  return wallet ? aesDecryptWallet(wallet) : null;
}

exports.tryCreateWallet = async (userId) => {
  const existedWallet = await getByUserId(userId);

  if (existedWallet) {
    return user;
  }

  const walletData = await generateWallet(userId);
  const wallet = await Wallet.create({
    userId,
    ...walletData
  });

  return wallet;
};

exports.updateCustomPin = async (userId, pinCode, options = {}) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'))
  assert(pinCode, Errors.ERR_IS_REQUIRED('pinCode'))
  const customPin = await getCustomPinByUserId(userId);
  if (customPin) {
    const {
      oldPinCode
    } = options;
    assert(oldPinCode, Errors.ERR_IS_REQUIRED('oldPinCode'))
    const cryptoOldPin = aesCrypto(oldPinCode, config.aesKey256);
    assert(customPin === cryptoOldPin, Errors.ERR_WALLET_MISMATCH_PIN);
  }
  const cryptoPin = aesCrypto(pinCode, config.aesKey256);
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
  assert(userId, Errors.ERR_IS_REQUIRED('userId'))
  assert(pinCode, Errors.ERR_IS_REQUIRED('pinCode'))
  const customPin = await getCustomPinByUserId(userId);
  if (customPin) {
    const cryptoPin = aesCrypto(pinCode, config.aesKey256);
    return customPin === cryptoPin;
  }
  return false;
}