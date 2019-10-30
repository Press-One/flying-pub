const Finance = require('../models/finance');
const Wallet = require('../models/wallet');
const Reward = require('../models/reward')
const {
  assert,
  Errors
} = require('../models/validator');
const {
  pTryLock,
  pUnLock
} = require('../models/cache');

const assertTooManyRequests = async (lockKey) => {
  const locked = await pTryLock(lockKey, 60 * 10);
  assert(!locked, 'too many request', 429);
};

exports.getBalance = async ctx => {
  const {
    user
  } = ctx.verification;
  const tasks = Object.keys(Finance.currencyMapAsset).map(async currency => {
    const balance = await Finance.getBalanceByUserId(user.id, currency);
    return {
      currency,
      balance
    };
  })
  const derivedBalances = await Promise.all(tasks);
  const balanceMap = {};
  for (const derivedBalance of derivedBalances) {
    balanceMap[derivedBalance.currency] = derivedBalance.balance;
  }
  ctx.ok(balanceMap);
}

exports.recharge = async ctx => {
  const data = ctx.request.body.payload;
  const {
    user
  } = ctx.verification;
  const key = `RECHARGE_${user.id}`;
  try {
    await assertTooManyRequests(key);
    const paymentUrl = await Finance.recharge({
      userId: user.id,
      currency: data && data.currency,
      amount: data && data.amount
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
  const {
    method
  } = ctx.request.query;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const {
    user
  } = ctx.verification;
  const key = `REWARD_${user.id}`;
  try {
    await assertTooManyRequests(key);
    const ret = await Finance.payForFile({
      userId: user.id,
      toAddress: data.toAddress,
      fileRId,
      currency: data.currency,
      amount: data.amount,
      memo: data.memo,
      toMixinClientId: data.toMixinClientId,
    }, {
      byMixin: method === 'mixin'
    });
    if (method === 'mixin') {
      ctx.ok({
        paymentUrl: ret
      });
      return;
    }
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

exports.getFileReward = async ctx => {
  const {
    fileRId
  } = ctx.params;
  const reward = await Reward.get(fileRId);
  const amount = reward ? reward.amount : 0;
  ctx.ok({
    amount
  });
}