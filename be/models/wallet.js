const Mixin = require('mixin-node');
const util = require('../utils');
const config = require('../config');
const {
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
  const {
    aesCrypto
  } = util.crypto;
  data.mixinAesKey = aesCrypto(data.mixinAesKey, config.aesKey256);
  data.mixinPin = aesCrypto(data.mixinPin, config.aesKey256);
  data.mixinSessionId = aesCrypto(data.mixinSessionId, config.aesKey256);
  data.mixinPrivateKey = aesCrypto(data.mixinPrivateKey, config.aesKey256);
  data.mixinAccount = aesCrypto(JSON.stringify(data.mixinAccount), config.aesKey256);
  return data;
};

exports.aesDecryptWallet = data => {
  const {
    aesDecrypt
  } = util.crypto;
  if (!data.mixinPrivateKey) {
    return data;
  }
  data.mixinAesKey = aesDecrypt(data.mixinAesKey, config.aesKey256);
  data.mixinPin = aesDecrypt(data.mixinPin, config.aesKey256);
  data.mixinSessionId = aesDecrypt(data.mixinSessionId, config.aesKey256);
  data.mixinPrivateKey = aesDecrypt(data.mixinPrivateKey, config.aesKey256);
  data.mixinAccount = JSON.parse(aesDecrypt(data.mixinAccount, config.aesKey256));
  return data;
};

exports.createWallet = async user => {
  assertFault(user, Errors.ERR_IS_REQUIRED(user));
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