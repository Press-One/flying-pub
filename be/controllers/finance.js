const Finance = require('../models/finance');
const {
  assert,
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
  const tasks = Object.keys(Finance.currencyMap).map(async currency => {
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
  const {
    user
  } = ctx.verification;
  const key = `WITHDRAW_${user.id}`;
  try {
    await assertTooManyRequests(key);
    await Finance.withdraw({
      userId: user.id,
      currency: data && data.currency,
      amount: data && data.amount,
      memo: data && data.memo,
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