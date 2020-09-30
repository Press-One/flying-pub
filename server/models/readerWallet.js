const util = require('../utils');
const walletConfig = require('../config.wallet');
const Wallet = require('./sequelize/wallet/readerWallet');
const {
  aesDecrypt
} = util.crypto;
const aesKey256 = walletConfig.encryption.aesKey256;

const getNumberByMixinClientId = mixinClientId => {
  let str = '';
  for (const char of mixinClientId) {
    if (/\d/.test(char) && String(Number(str)).length < 6) {
      str += char;
    }
  }
  return Number(str);
}

const aesDecryptWallet = data => {
  if (!data.mixinAccount) {
    return data;
  }
  const counterInitialValue = data.version === 1 ? getNumberByMixinClientId(data.mixinClientId) + Number(data.mixinPin) + walletConfig.encryption.salt : 5;
  data.mixinPin = data.version === 1 ? data.mixinPin : aesDecrypt(data.mixinPin, aesKey256, counterInitialValue);
  data.mixinAesKey = aesDecrypt(data.mixinAesKey, aesKey256, counterInitialValue);
  data.mixinSessionId = aesDecrypt(data.mixinSessionId, aesKey256, counterInitialValue);
  data.mixinPrivateKey = aesDecrypt(data.mixinPrivateKey, aesKey256, counterInitialValue);
  data.mixinAccount = JSON.parse(aesDecrypt(data.mixinAccount, aesKey256, counterInitialValue));
  return data;
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