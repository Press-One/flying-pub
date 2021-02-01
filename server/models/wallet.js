const Mixin = require('mixin-node');
const image2base64 = require('image-to-base64');
const util = require('../utils');
const config = require('../config');
const walletConfig = require('../config.wallet');
const Wallet = require('./sequelize/wallet');
const Cache = require('./cache');
const {
  aesCrypto,
  aesDecrypt
} = util.crypto;
const {
  assert,
  assertFault,
  Errors
} = require('../utils/validator')
const aesKey256 = walletConfig.encryption.aesKey256;

const mixin = new Mixin({
  client_id: config.provider.mixin.clientId,
  aeskey: config.provider.mixin.aesKey,
  pin: config.provider.mixin.pinCode,
  session_id: config.provider.mixin.sessionId,
  privatekey: Buffer.from(config.provider.mixin.privateKey, 'utf8')
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
  const counterInitialValue = getNumberByMixinClientId(data.mixinClientId) + Number(data.mixinPin) + walletConfig.encryption.salt;
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
  const counterInitialValue = data.version === 1 ? getNumberByMixinClientId(data.mixinClientId) + Number(data.mixinPin) + walletConfig.encryption.salt : 5;
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

exports.updateNickname = async (userAddress, nickname) => {
  assertFault(userAddress, Errors.ERR_IS_REQUIRED('userAddress'))
  assertFault(nickname, Errors.ERR_IS_REQUIRED('nickname'))
  const wallet = await exports.getRawByUserAddress(userAddress);
  assertFault(wallet, Errors.ERR_IS_REQUIRED('wallet'))
  const updateOptions = {
    client_id: wallet.mixinClientId,
    session_id: wallet.mixinSessionId,
    privatekey: wallet.mixinPrivateKey
  };
  const mxProfileRaw = await mixin.account.updateProfile({
    full_name: nickname
  }, updateOptions);
  assertFault(mxProfileRaw, Errors.ERR_WALLET_FAIL_TO_UPDATE_NICKNAME);
}

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

exports.tryCreateWallet = async (userAddress, userNickName) => {
  assertFault(userAddress, Errors.ERR_IS_REQUIRED(userAddress));
  const existedWallet = await getByUserAddress(userAddress);

  if (existedWallet) {
    return true;
  }

  const walletData = await generateWallet(userNickName);
  const wallet = await Wallet.create({
    userAddress,
    ...walletData
  });

  return wallet;
};

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