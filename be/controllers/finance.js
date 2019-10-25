const finance = require('../models/finance');
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

exports.recharge = async (ctx) => {
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  assert(data.amount, Errors.ERR_IS_REQUIRED('data.amount'));
  const {
    user
  } = ctx.verification;
  assert(user, Errors.ERR_IS_REQUIRED('user'));
  assert(user.address, Errors.ERR_IS_REQUIRED('user.address'));
  const key = `RECHARGE_${user.address}`;
  const officiaCurrency = 'CNB';
  try {
    await assertTooManyRequests(key);
    const paymentUrl = await finance.recharge(
      user.address,
      officiaCurrency,
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