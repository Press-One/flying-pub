const util = require('../utils');
const walletConfig = require('../config.wallet');
const Wallet = require('./sequelize/wallet/readerWallet');
const {
  aesCrypto,
  aesDecrypt
} = util.crypto;
const {
  assert,
  Errors
} = require('../utils/validator')
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

const getByUserAddress = async userAddress => {
  const wallet = await Wallet.findOne({
    where: {
      userAddress
    }
  });
  if (!wallet) {
    return null;
  }
  const walletJson = wallet.toJSON()
  walletJson.version = Number(walletJson.version);
  return walletJson;
}

exports.exists = async userAddress => {
  const wallet = await getByUserAddress(userAddress);
  return !!wallet;
}

exports.getMixinClientIdByUserAddress = async userAddress => {
  const wallet = await getByUserAddress(userAddress);
  return wallet ? wallet.mixinClientId : null;
}

const getCustomPinByUserAddress = async userAddress => {
  const wallet = await getByUserAddress(userAddress);
  return wallet ? wallet.customPin : null;
}
exports.getCustomPinByUserAddress = getCustomPinByUserAddress;

exports.getRawByUserAddress = async userAddress => {
  const wallet = await getByUserAddress(userAddress);
  return wallet ? aesDecryptWallet(wallet) : null;
}

exports.updateCustomPin = async (userAddress, pinCode, options = {}) => {
  assert(userAddress, Errors.ERR_IS_REQUIRED('userAddress'))
  assert(pinCode, Errors.ERR_IS_REQUIRED('pinCode'))
  const wallet = await getByUserAddress(userAddress);
  assert(wallet, Errors.ERR_NOT_FOUND('wallet'));
  const {
    customPin
  } = wallet;
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
      userAddress
    }
  });
  return true;
}

exports.validatePin = async (userAddress, pinCode) => {
  assert(userAddress, Errors.ERR_IS_REQUIRED('userAddress'))
  assert(pinCode, Errors.ERR_IS_REQUIRED('pinCode'))
  const wallet = await getByUserAddress(userAddress);
  assert(wallet, Errors.ERR_NOT_FOUND('wallet'));
  const {
    customPin
  } = wallet;
  if (customPin) {
    const cryptoPin = aesCrypto(pinCode, aesKey256);
    return customPin === cryptoPin;
  }
  return false;
}