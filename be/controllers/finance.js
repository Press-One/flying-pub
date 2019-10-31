const Finance = require('../models/finance');
const Wallet = require('../models/wallet');
const Reward = require('../models/reward')
const User = require('../models/user')
const {
  assert,
  Errors
} = require('../models/validator');
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
  const balanceMap = await Finance.getBalanceMap(user.id);
  ctx.ok(balanceMap);
}

exports.recharge = async ctx => {
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const {
    user
  } = ctx.verification;
  const key = `RECHARGE_${user.id}`;
  try {
    await assertTooManyRequests(key);
    const paymentUrl = await Finance.recharge({
      userId: user.id,
      currency: data.currency,
      amount: data.amount,
      memo: data.memo
    });
    ctx.ok({
      paymentUrl
    });
  } catch (err) {
    console.log(` ------------- err ---------------`, err);
    ctx.er(err);
  } finally {
    pUnLock(key);
  }
};

exports.withdraw = async ctx => {
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const {
    user
  } = ctx.verification;
  const key = `WITHDRAW_${user.id}`;
  try {
    await assertTooManyRequests(key);
    await Finance.withdraw({
      userId: user.id,
      currency: data.currency,
      amount: data.amount,
      memo: data.memo,
    });
    ctx.ok({
      success: true
    });
  } catch (err) {
    console.log(` ------------- err ---------------`, err);
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
  const receipts = await Finance.getReceiptsByUserAddress(user.address, {
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
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const {
    pinCode,
    oldPinCode
  } = data;
  await Wallet.updateCustomPin(user.id, pinCode, {
    oldPinCode
  });
  ctx.ok({
    success: true
  });
}

exports.isCustomPinExist = async ctx => {
  const {
    user
  } = ctx.verification;
  const wallet = await Wallet.getByUserId(user.id);
  ctx.ok(!!wallet.customPin);
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
  const isValid = await Wallet.validatePin(user.id, pinCode);
  ctx.ok(isValid);
}

exports.reward = async ctx => {
  const {
    fileRId
  } = ctx.params;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const {
    user
  } = ctx.verification;
  const key = `REWARD_${user.id}`;
  try {
    await assertTooManyRequests(key);
    await Finance.payForFile({
      userId: user.id,
      toAddress: data.toAddress,
      fileRId,
      currency: data.currency,
      amount: data.amount,
      memo: data.memo,
      toMixinClientId: data.toMixinClientId,
    });
    ctx.ok({
      success: true
    });
  } catch (err) {
    console.log(` ------------- err ---------------`, err);
    ctx.er(err);
  } finally {
    pUnLock(key);
  }
}

exports.getRewardSummary = async ctx => {
  const {
    fileRId
  } = ctx.params;
  const reward = await Reward.get(fileRId);
  const summary = reward ? JSON.parse(reward.summary) : {};
  const receipts = await Finance.getReceiptsByFileRId(fileRId);
  const userAddressSet = new Set();
  for (const receipt of receipts) {
    userAddressSet.add(receipt.fromAddress);
  }
  const userAddressArr = Array.from(userAddressSet)
  const tasks = userAddressArr.map(address => User.getByAddress(address, {
    withProfile: true
  }));
  const users = await Promise.all(tasks)
  ctx.ok({
    amountMap: summary,
    users
  });
}