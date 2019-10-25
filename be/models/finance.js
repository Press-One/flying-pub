const mathjs = require('mathjs');
const uuidV1 = require('uuid/v1');
const Mixin = require('mixin-node');
const config = require('../config');
const Wallet = require('./wallet');
const Receipt = require('./sequelize/receipt');
const {
  Joi,
  assert,
  attempt,
  Errors,
  assertFault
} = require('./validator');

const parseAmount = (amount) => {
  return /^-?\d+(\.\d+)?$/.test(amount = String(amount)) &&
    mathjs.larger('1000000000000000000000000000000', amount) // max length = 30 // + 1 for checking
    &&
    mathjs.larger(amount, 0) && amount;
};

const currencies = {
  CNB: '965e5c6e-434c-3fa9-b780-c50f43cd955c',
  PRS: '3edb734c-6d6f-32ff-ab03-4eb43640c758'
};

const transferTypes = new Set([
  'AWARD',
  'WITHDRAW',
  'RECHARGE'
]);

const transferObjectTypes = new Set(['FILE']);

const mixin = new Mixin({
  client_id: config.mixin.clientId,
  aeskey: config.mixin.aesKey,
  pin: config.mixin.pinCode,
  session_id: config.mixin.sessionId,
  privatekey: config.mixin.privateKeyFilePath
});

const create = async (receipt, options = {}) => {
  attempt(receipt, {
    fromAddress: Joi.string().required(),
    toAddress: Joi.string().required(),
    type: Joi.string().required(),
    currency: Joi.string().required(),
    amount: Joi.number().required(),
    status: Joi.string().required(),
    provider: Joi.string().required(),
    memo: Joi.string().optional(),
    toProviderUserId: Joi.string().optional(),
    objectType: Joi.string().optional(),
  });
  receipt.amount = parseAmount(receipt.amount);
  assert((receipt.amount), Errors.ERR_IS_INVALID('amount'));
  assert(transferTypes.has(receipt.type), Errors.ERR_IS_INVALID('type'));
  assert(!receipt.objectType || transferObjectTypes.has(receipt.objectType), Errors.ERR_IS_INVALID('objectType'));
  assert(currencies[receipt.currency], Errors.ERR_IS_INVALID('currency'));

  options = options || {};
  receipt.uuid = receipt.uuid || uuidV1();
  receipt.objectType = receipt.objectType || '';

  const newReceipt = await Receipt.create(receipt);
  return newReceipt.toJSON();
  // sendTransationAndBalanceToAddress(objReceipt);
};

const getMixinPaymentUrl = (options = {}) => {
  const {
    mixinAccountId,
    currency,
    amount,
    trace,
    memo
  } = options;
  return ('https://mixin.one/pay' +
    '?recipient=' + encodeURIComponent(mixinAccountId) +
    '&asset=' + encodeURIComponent(currency) +
    '&amount=' + encodeURIComponent(amount) +
    '&trace=' + encodeURIComponent(trace) +
    '&memo=' + encodeURIComponent(memo));
};

exports.recharge = async (toAddress, currency, amount, memo) => {
  const wallet = await Wallet.getByAddress(toAddress);
  assert(wallet, Errors.ERR_NOT_FOUND('user wallet'));
  assertFault(wallet.mixinClientId, Errors.ERR_WALLET_STATUS);
  const receipt = await create({
    fromAddress: toAddress,
    toAddress: toAddress,
    type: 'RECHARGE',
    currency: currency,
    amount: amount,
    status: 'INITIALIZED',
    provider: 'MIXIN',
    memo: memo || 'Recharge from MIXIN',
    toProviderUserId: wallet.mixinClientId
  }, undefined);
  assertFault(receipt, Errors.ERR_RECEIPT_FAIL_TO_INIT);
  const paymentUrl = getMixinPaymentUrl({
    mixinAccountId: wallet.mixinClientId,
    currency: currencies[receipt.currency],
    amount: parseAmount(amount),
    trace: receipt.uuid,
    memo
  });
  assertFault(paymentUrl, Errors.ERR_RECEIPT_FAIL_TO_CREATE_PAYMENT_URL);
  return paymentUrl;
};

const getAsset = async (currency, clientId, sessionId, privateKey) => {
  assert(currency, Errors.ERR_IS_REQUIRED('currency'));
  assert(clientId, Errors.ERR_IS_REQUIRED('clientId'));
  assert(sessionId, Errors.ERR_IS_REQUIRED('sessionId'));
  assert(privateKey, Errors.ERR_IS_REQUIRED('privateKey'));
  let raw = await mixin.account.readAssets(currencies[currency], {
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