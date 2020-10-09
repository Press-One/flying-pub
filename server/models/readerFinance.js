const mathjs = require("mathjs");
const Mixin = require("mixin-node");
const config = require("../config");
const Wallet = require("./readerWallet");
const User = require("./user");
const Cache = require("./cache");
const Log = require("./log");
const Receipt = require("./readerReceipt");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const {
  Joi,
  assert,
  attempt,
  Errors,
  assertFault
} = require("../utils/validator");
const {
  parseAmount,
  currencyMapAsset
} = Receipt;

const mixin = new Mixin({
  client_id: config.provider.mixin.clientId,
  aeskey: config.provider.mixin.aesKey,
  pin: config.provider.mixin.pinCode,
  session_id: config.provider.mixin.sessionId,
  privatekey: Buffer.from(config.provider.mixin.privateKey, 'utf8')
});

const getViewToken = snapshotId => {
  return mixin.getViewToken(`/network/snapshots/${snapshotId}`, {
    timeout: 60 * 60 * 24 * 365 * 100 // 100 years
  });
};

exports.withdraw = async (data = {}) => {
  data.amount = parseAmount(data.amount);
  data.memo = data.memo || `飞帖提现（${config.settings['site.name']}）`;
  const {
    userId,
    userAddress,
    currency,
    amount,
    memo = "飞帖提现"
  } = data;
  assert(amount, Errors.ERR_IS_INVALID("amount"));
  const wallet = await Wallet.getRawByUserAddress(userAddress);
  assert(wallet, Errors.ERR_NOT_FOUND("user wallet"));
  Log.create(userId, `钱包版本 ${wallet.version}`);
  assertFault(wallet.mixinClientId, Errors.ERR_WALLET_STATUS);
  const asset = await getAsset({
    currency,
    clientId: wallet.mixinClientId,
    sessionId: wallet.mixinSessionId,
    privateKey: wallet.mixinPrivateKey
  });
  assertFault(asset, Errors.ERR_WALLET_FAIL_TO_ACCESS_MIXIN_WALLET);
  assert(
    !mathjs.larger(amount, asset.balance) ||
    mathjs.equal(amount, asset.balance),
    Errors.ERR_WALLET_NOT_ENOUGH_AMOUNT,
    402
  );
  const mixinAccount = await User.getMixinAccount(userId);
  assert(mixinAccount, Errors.ERR_NOT_FOUND("user mixinAccount"));
  const toMixinClientId = mixinAccount.user_id;
  assert(toMixinClientId, Errors.ERR_NOT_FOUND("toMixinClientId"));
  const receipt = await Receipt.create({
    fromAddress: userAddress,
    toAddress: userAddress,
    type: "WITHDRAW",
    currency: currency,
    amount: amount,
    status: "INITIALIZED",
    provider: "MIXIN",
    memo,
    fromProviderUserId: wallet.mixinClientId,
    toProviderUserId: toMixinClientId
  });
  assertFault(receipt, Errors.ERR_WALLET_FAIL_TO_CREATE_WITHDRAW_RECEIPT);
  const tfRaw = await transfer({
    currency,
    toMixinClientId,
    amount,
    memo,
    mixinPin: wallet.mixinPin,
    mixinAesKey: wallet.mixinAesKey,
    mixinClientId: wallet.mixinClientId,
    mixinSessionId: wallet.mixinSessionId,
    mixinPrivateKey: wallet.mixinPrivateKey,
    traceId: receipt.uuid
  });
  await updateReceiptByUuid(receipt.uuid, {
    status: tfRaw ? "SUCCESS" : "FAILED",
    raw: tfRaw || null,
    snapshotId: tfRaw.snapshot_id,
    uuid: tfRaw.trace_id,
    viewToken: tfRaw.viewToken
  });
  return true;
};


const updateReceiptByUuid = async (uuid, data) => {
  assert(data && Object.keys(data).length, Errors.ERR_IS_INVALID("data"));
  assert(data.raw || data.toRaw, Errors.ERR_IS_INVALID("data raw"));
  if (data.raw) {
    data.raw = JSON.stringify(data.raw);
  }
  if (data.toRaw) {
    data.toRaw = JSON.stringify(data.toRaw);
  }
  assert(uuid, Errors.ERR_IS_REQUIRED("uuid"));
  const receipt = await Receipt.getByUuid(uuid);
  if (receipt.status === "SUCCESS") {
    if (data.raw && receipt.raw) {
      return null;
    }
    if (data.toRaw && receipt.toRaw) {
      return null;
    }
  }
  if (receipt.viewToken) {
    delete data.viewToken;
  }
  const lockKey = `${config.serviceKey}_UPDATE_RECEIPT_${data.raw ? 'WITH_RAW' : 'WITH_TO_RAW'}_${uuid}`;
  const locked = await Cache.pTryLock(lockKey, 10); // 10s
  if (locked) {
    return null;
  }
  await Receipt.updateByUuid(uuid, data);
  Cache.pUnLock(lockKey);
};

const transfer = async (data = {}) => {
  data.amount = parseAmount(data.amount);
  data = attempt(data, {
    currency: Joi.string()
      .trim()
      .required(),
    toMixinClientId: Joi.string()
      .trim()
      .required(),
    amount: Joi.string()
      .trim()
      .required(),
    memo: Joi.string()
      .trim()
      .required(),
    mixinPin: Joi.string()
      .trim()
      .required(),
    mixinAesKey: Joi.string()
      .trim()
      .required(),
    mixinClientId: Joi.string()
      .trim()
      .required(),
    mixinSessionId: Joi.string()
      .trim()
      .required(),
    mixinPrivateKey: Joi.string()
      .trim()
      .required(),
    traceId: Joi.string()
      .trim()
      .required()
  });
  const {
    currency,
    toMixinClientId,
    amount,
    memo,
    mixinPin,
    mixinAesKey,
    mixinClientId,
    mixinSessionId,
    mixinPrivateKey,
    traceId
  } = data;
  const result = await mixin.account.transfer(
    currencyMapAsset[currency],
    toMixinClientId,
    amount,
    memo, {
      pin: mixinPin,
      aesKey: mixinAesKey,
      client_id: mixinClientId,
      session_id: mixinSessionId,
      privateKey: mixinPrivateKey
    },
    traceId
  );
  assertFault(
    result && result.data,
    `Errors.ERR_WALLET_FAIL_TO_ACCESS_MIXIN_WALLET: ${JSON.stringify(
      result.error
    )}`
  );
  result.data.viewToken = getViewToken(result.data.snapshot_id);
  return result.data;
};

const getBalanceByUserAddress = async (userAddress, currency) => {
  const wallet = await Wallet.getRawByUserAddress(userAddress);
  assert(wallet, Errors.ERR_NOT_FOUND("wallet"));
  const resp = await getAsset({
    currency,
    clientId: wallet.mixinClientId,
    sessionId: wallet.mixinSessionId,
    privateKey: wallet.mixinPrivateKey
  });
  return Number(resp.balance);
};

const getAsset = async (data = {}) => {
  const {
    currency,
    clientId,
    sessionId,
    privateKey
  } = data;
  assert(currency, Errors.ERR_IS_REQUIRED("currency"));
  assert(clientId, Errors.ERR_IS_REQUIRED("clientId"));
  assert(sessionId, Errors.ERR_IS_REQUIRED("sessionId"));
  assert(privateKey, Errors.ERR_IS_REQUIRED("privateKey"));
  let raw = await mixin.account.readAssets(currencyMapAsset[currency], {
    client_id: clientId,
    session_id: sessionId,
    privateKey
  });
  assertFault(raw && raw.data, Errors.ERR_WALLET_FAIL_TO_ACCESS_MIXIN_WALLET);
  return {
    symbol: raw.data.symbol,
    name: raw.data.name,
    icon_url: raw.data.icon_url,
    balance: raw.data.balance,
    account_name: raw.data.account_name,
    account_tag: raw.data.account_tag,
    price_btc: raw.data.price_btc,
    price_usd: raw.data.price_usd,
    change_btc: raw.data.change_btc,
    change_usd: raw.data.change_usd,
    confirmations: raw.data.confirmations
  };
};

exports.getBalanceMap = async address => {
  const tasks = Object.keys(currencyMapAsset).map(async currency => {
    const balance = await getBalanceByUserAddress(address, currency);
    return {
      currency,
      balance
    };
  });
  const derivedBalances = await Promise.all(tasks);
  const balanceMap = {};
  for (const derivedBalance of derivedBalances) {
    balanceMap[derivedBalance.currency] = derivedBalance.balance;
  }
  return balanceMap;
};

exports.getWalletMixinClientId = async address => {
  assert(address, Errors.ERR_IS_REQUIRED("address"));
  const wallet = await Wallet.getRawByUserAddress(address);
  assert(wallet, Errors.ERR_IS_REQUIRED("wallet"));
  return wallet.mixinClientId
};


exports.getReceiptsByUserAddress = async (userAddress, options = {}) => {
  assert(userAddress, Errors.ERR_IS_REQUIRED("userAddress"));
  const {
    offset = 0, limit, status
  } = options;
  const receipts = await Receipt.list({
    where: {
      [Op.or]: [{
          fromAddress: userAddress
        },
        {
          toAddress: userAddress
        }
      ],
      status
    },
    offset,
    limit,
    order: [
      ["updatedAt", "DESC"]
    ]
  });
  return receipts;
};