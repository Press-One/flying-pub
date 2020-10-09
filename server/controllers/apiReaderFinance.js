const ReaderFinance = require('../models/readerFinance');
const ReaderWallet = require('../models/readerWallet');
const Log = require('../models/log')
const {
  assert,
  Errors
} = require('../utils/validator');
const {
  pTryLock,
  pUnLock
} = require('../models/cache');

const assertTooManyRequests = async (lockKey) => {
  const locked = await pTryLock(lockKey, 10);
  assert(!locked, 'too many request', 429);
};

exports.getBalance = async ctx => {
  const {
    user
  } = ctx.verification;
  assert(user.SSO, Errors.ERR_NOT_FOUND('user.SSO'));
  const userAddress = user.SSO.reader.address;
  const balanceMap = await ReaderFinance.getBalanceMap(userAddress);
  ctx.ok(balanceMap);
}

exports.withdraw = async ctx => {
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const {
    user
  } = ctx.verification;
  const userAddress = user.SSO.reader.address;
  const key = `WITHDRAW_${userAddress}`;
  try {
    await assertTooManyRequests(key);
    Log.create(user.id, `【Reader 旧钱包】开始提现 ${data.amount} ${data.currency} ${data.memo || ''}`);
    await ReaderFinance.withdraw({
      userId: user.id,
      userAddress,
      currency: data.currency,
      amount: data.amount,
      memo: data.memo,
    });
    Log.create(user.id, `【Reader 旧钱包】完成提现 ${data.amount} ${data.currency} ${data.memo || ''}`);
    ctx.ok({
      success: true
    });
  } catch (err) {
    console.log(err);
    ctx.er(err);
  } finally {
    pUnLock(key);
  }
};


exports.getReceipts = async ctx => {
  const {
    user
  } = ctx.verification;
  const {
    offset = 0, limit
  } = ctx.query;
  const userAddress = user.SSO.reader.address;
  const receipts = await ReaderFinance.getReceiptsByUserAddress(userAddress, {
    offset,
    limit: Math.min(~~limit || 10, 100),
    status: 'SUCCESS'
  });
  ctx.body = receipts;
}

exports.updateCustomPin = async ctx => {
  const {
    user
  } = ctx.verification;
  const data = ctx.request.body.payload;
  const userAddress = user.SSO.reader.address;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const {
    pinCode,
    oldPinCode
  } = data;
  await ReaderWallet.updateCustomPin(userAddress, pinCode, {
    oldPinCode
  });
  Log.create(user.id, '【Reader 旧钱包】更新 pin 成功');
  ctx.ok({
    success: true
  });
}

exports.isCustomPinExist = async ctx => {
  const {
    user
  } = ctx.verification;
  const userAddress = user.SSO.reader.address;
  const customPin = await ReaderWallet.getCustomPinByUserAddress(userAddress);
  ctx.ok(!!customPin);
}

exports.validatePin = async ctx => {
  const {
    user
  } = ctx.verification;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const {
    pinCode
  } = data;
  const userAddress = user.SSO.reader.address;
  const isValid = await ReaderWallet.validatePin(userAddress, pinCode);
  Log.create(user.id, `【Reader 旧钱包】验证 pin ${isValid ? '成功' : '失败'}`);
  ctx.ok(isValid);
}