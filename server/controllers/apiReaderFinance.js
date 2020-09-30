const ReaderFinance = require('../models/readerFinance');
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

exports.getWalletMixinClientId = async ctx => {
  const {
    user
  } = ctx.verification;
  const mixinClientId = await ReaderFinance.getWalletMixinClientId(user.id);
  ctx.ok(mixinClientId);
}

exports.getReaderBalance = async ctx => {
  const {
    user
  } = ctx.verification;
  const balanceMap = await ReaderFinance.getBalanceMap(user.id);
  ctx.ok(balanceMap);
}

exports.readerWithdraw = async ctx => {
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const {
    user
  } = ctx.verification;
  const key = `WITHDRAW_${user.id}`;
  try {
    await assertTooManyRequests(key);
    Log.create(user.id, `开始提现 ${data.amount} ${data.currency} ${data.memo || ''}`);
    await ReaderFinance.withdraw({
      userId: user.id,
      currency: data.currency,
      amount: data.amount,
      memo: data.memo,
    });
    Log.create(user.id, `完成提现 ${data.amount} ${data.currency} ${data.memo || ''}`);
    ctx.ok({
      success: true
    });
  } catch (err) {
    ctx.er(err);
  } finally {
    pUnLock(key);
  }
};