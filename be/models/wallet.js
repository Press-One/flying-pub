const Mixin = require('mixin-node');
const util = require('../utils');
const config = require('../config');
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

const aesCryptoWallet = data => {
  data.mixinAesKey = aesCrypto(data.mixinAesKey, config.aesKey256);
  data.mixinPin = aesCrypto(data.mixinPin, config.aesKey256);
  data.mixinSessionId = aesCrypto(data.mixinSessionId, config.aesKey256);
  data.mixinPrivateKey = aesCrypto(data.mixinPrivateKey, config.aesKey256);
  data.mixinAccount = aesCrypto(JSON.stringify(data.mixinAccount), config.aesKey256);
  return data;
};

const aesDecryptWallet = data => {
  if (!data.mixinAccount) {
    return data;
  }
  data.mixinAesKey = aesDecrypt(data.mixinAesKey, config.aesKey256);
  data.mixinPin = aesDecrypt(data.mixinPin, config.aesKey256);
  data.mixinSessionId = aesDecrypt(data.mixinSessionId, config.aesKey256);
  data.mixinPrivateKey = aesDecrypt(data.mixinPrivateKey, config.aesKey256);
  data.mixinAccount = JSON.parse(aesDecrypt(data.mixinAccount, config.aesKey256));
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
    mixinAccount: mxRaw
  };
  // 更新 1px 的透明图片
  let mxProfileRaw = await mixin.account.updateProfile({
    avatar_base64: config.logoBase64
  }, updateOptions);
  assertFault(mxProfileRaw, Errors.ERR_WALLET_FAIL_TO_UPDATE_AVATAR);
  console.log(`${user.id}: 初始化钱包成功`);

  return aesCryptoWallet(wallet);
};

const getByUserId = async userId => {
  const wallet = await Wallet.findOne({
    where: {
      userId
    }
  });
  return wallet ? aesDecryptWallet(wallet.toJSON()) : null;
}
exports.getByUserId = getByUserId;

exports.tryCreateWallet = async (userId) => {
  const existedWallet = await getByUserId(userId);

  if (existedWallet) {
    console.log(`${userId}： 钱包已存在，无需初始化`);
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
  const wallet = await getByUserId(userId);
  console.log(` ------------- wallet.customPin ---------------`, wallet.customPin);
  if (wallet.customPin) {
    const {
      oldPinCode
    } = options;
    assert(oldPinCode, Errors.ERR_IS_REQUIRED('oldPinCode'))
    const cryptoOldPin = aesCrypto(oldPinCode, config.aesKey256);
    console.log(` ------------- cryptoOldPin ---------------`, cryptoOldPin);
    assert(wallet.customPin === cryptoOldPin, Errors.ERR_WALLET_MISMATCH_PIN);
  }
  const cryptoPin = aesCrypto(pinCode, config.aesKey256);
  console.log(` ------------- cryptoPin ---------------`, cryptoPin);
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
  const wallet = await getByUserId(userId);
  if (wallet.customPin) {
    const cryptoPin = aesCrypto(pinCode, config.aesKey256);
    console.log(` ------------- wallet.customPin ---------------`, wallet.customPin);
    console.log(` ------------- cryptoPin ---------------`, cryptoPin);
    return wallet.customPin === cryptoPin;
  }
  return false;
}