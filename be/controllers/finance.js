const Finance = require('../models/finance');
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
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  assert(data.amount, Errors.ERR_IS_REQUIRED('data.amount'));
  assert(data.currency, Errors.ERR_IS_REQUIRED('data.currency'));
  const {
    user
  } = ctx.verification;
  assert(user, Errors.ERR_IS_REQUIRED('user'));
  assert(user.address, Errors.ERR_IS_REQUIRED('user.address'));
  const key = `RECHARGE_${user.address}`;
  try {
    await assertTooManyRequests(key);
    const paymentUrl = await Finance.recharge(
      user.address,
      data.currency,
      data.amount,
      undefined, undefined
    );
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