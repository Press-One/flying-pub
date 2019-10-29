const mathjs = require('mathjs');
const uuidV1 = require('uuid/v1');
const Mixin = require('mixin-node');
const rfc3339nano = require('rfc3339nano');
const fs = require('fs');
const config = require('../config');
const User = require('./user');
const Wallet = require('./wallet');
const Receipt = require('./sequelize/receipt');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
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

const currencyMap = {
  CNB: '965e5c6e-434c-3fa9-b780-c50f43cd955c',
  BTC: 'c6d0c728-2624-429b-8e0d-d9d19b6592fa',
  ETH: '43d61dcd-e413-450d-80b8-101d5e903357',
  EOS: '6cfe566e-4aad-470b-8c9a-2fd35b49c68d',
  BOX: 'f5ef6b5d-cc5a-3d90-b2c0-a2fd386e7a3c',
  PRS: '3edb734c-6d6f-32ff-ab03-4eb43640c758',
  XIN: 'c94ac88f-4671-3976-b60a-09064f1811e8'
};
exports.currencyMap = currencyMap;

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
    fromProviderUserId: Joi.string().optional(),
    objectType: Joi.string().optional(),
  });
  receipt.amount = parseAmount(receipt.amount);
  assert((receipt.amount), Errors.ERR_IS_INVALID('amount'));
  assert(transferTypes.has(receipt.type), Errors.ERR_IS_INVALID('type'));
  assert(!receipt.objectType || transferObjectTypes.has(receipt.objectType), Errors.ERR_IS_INVALID('objectType'));
  assert(currencyMap[receipt.currency], Errors.ERR_IS_INVALID('currency'));

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

exports.recharge = async (data = {}) => {
  data.amount = parseAmount(data.amount);
  data.memo = data.memo || '飞贴提现';
  const {
    userId,
    currency,
    amount,
    memo
  } = data;
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(currency, Errors.ERR_IS_REQUIRED('currency'));
  assert(amount, Errors.ERR_IS_REQUIRED('amount'));
  const wallet = await Wallet.getByUserId(userId);
  assert(wallet, Errors.ERR_NOT_FOUND('user wallet'));
  assertFault(wallet.mixinClientId, Errors.ERR_WALLET_STATUS);
  const user = await User.get(userId, {
    withProfile: true
  });
  const receipt = await create({
    fromAddress: user.address,
    toAddress: user.address,
    type: 'RECHARGE',
    currency: currency,
    amount: amount,
    status: 'INITIALIZED',
    provider: 'MIXIN',
    memo,
    toProviderUserId: wallet.mixinClientId
  }, undefined);
  assertFault(receipt, Errors.ERR_RECEIPT_FAIL_TO_INIT);
  const paymentUrl = getMixinPaymentUrl({
    mixinAccountId: wallet.mixinClientId,
    currency: currencyMap[receipt.currency],
    amount: parseAmount(amount),
    trace: receipt.uuid,
    memo
  });
  assertFault(paymentUrl, Errors.ERR_RECEIPT_FAIL_TO_CREATE_PAYMENT_URL);
  return paymentUrl;
};

exports.withdraw = async (data = {}) => {
  data.amount = parseAmount(data.amount);
  data.memo = data.memo || '飞贴提现';
  const {
    userId,
    currency,
    amount,
    memo = '飞贴提现'
  } = data;
  assert(amount, Errors.ERR_IS_INVALID('amount'));
  const wallet = await Wallet.getByUserId(userId);
  assert(wallet, Errors.ERR_NOT_FOUND('user wallet'));
  assertFault(wallet.mixinClientId, Errors.ERR_WALLET_STATUS);
  // @todo: 检查最大交易限额
  const asset = await getAsset({
    currency,
    clientId: wallet.mixinClientId,
    sessionId: wallet.mixinSessionId,
    privateKey: wallet.mixinPrivateKey,
  });
  assertFault(asset, Errors.ERR_WALLET_FAIL_TO_ACCESS_MIXIN_WALLET);
  console.log(` ------------- amount ---------------`, amount);
  console.log(` ------------- asset.balance ---------------`, asset.balance);
  assert(
    !mathjs.larger(amount, asset.balance) || mathjs.equal(amount, asset.balance),
    Errors.ERR_WALLET_NOT_ENOUGH_AMOUNT,
    402
  );
  const user = await User.get(userId, {
    withProfile: true
  });
  const mixinAccountId = JSON.parse(user.raw).user_id;
  assert(mixinAccountId, Errors.ERR_NOT_FOUND('mixinAccountId'));
  const receipt = await create({
    fromAddress: user.address,
    toAddress: user.address,
    type: 'WITHDRAW',
    currency: currency,
    amount: amount,
    status: 'INITIALIZED',
    provider: 'MIXIN',
    memo,
    fromProviderUserId: wallet.mixinClientId,
    toProviderUserId: mixinAccountId
  });
  assertFault(receipt, Errors.ERR_WALLET_FAIL_TO_CREATE_WITHDRAW_RECEIPT);
  const tfRaw = await transfer({
    currency,
    mixinAccountId,
    amount,
    memo,
    mixinPin: wallet.mixinPin,
    mixinAesKey: wallet.mixinAesKey,
    mixinClientId: wallet.mixinClientId,
    mixinSessionId: wallet.mixinSessionId,
    mixinPrivateKey: wallet.mixinPrivateKey,
    traceId: receipt.uuid,
  });
  await updateByUuid({
    status: tfRaw ? 'SUCCESS' : 'FAILED',
    raw: tfRaw || null,
    snapshotId: tfRaw.snapshot_id,
    uuid: tfRaw.trace_id,
    // viewToken: tfRaw.viewToken
  }, receipt.uuid, null);
  const latestAsset = await getAsset({
    currency,
    clientId: wallet.mixinClientId,
    sessionId: wallet.mixinSessionId,
    privateKey: wallet.mixinPrivateKey,
  });
  assertFault(latestAsset, Errors.ERR_WALLET_FETCH_BALANCE);
  // socketIo.sendToAddress(userId, 'balance', asset);
  return true;
}

const transfer = async (data = {}) => {
  data.amount = parseAmount(data.amount);
  const {
    currency,
    mixinAccountId,
    amount,
    memo,
    mixinPin,
    mixinAesKey,
    mixinClientId,
    mixinSessionId,
    mixinPrivateKey,
    traceId
  } = data;
  assert((amount), Errors.ERR_IS_INVALID('amount'));
  assert(currency, Errors.ERR_IS_REQUIRED('currency'));
  assert(mixinAccountId, Errors.ERR_IS_REQUIRED('mixinAccountId'));
  assert(amount, Errors.ERR_IS_REQUIRED('amount'));
  assert(memo, Errors.ERR_IS_REQUIRED('memo'));
  assert(mixinPin, Errors.ERR_IS_REQUIRED('mixinPin'));
  assert(mixinAesKey, Errors.ERR_IS_REQUIRED('currency'));
  assert(mixinClientId, Errors.ERR_IS_REQUIRED('mixinClientId'));
  assert(mixinSessionId, Errors.ERR_IS_REQUIRED('mixinSessionId'));
  assert(mixinPrivateKey, Errors.ERR_IS_REQUIRED('mixinPrivateKey'));
  assert(traceId, Errors.ERR_IS_REQUIRED('traceId'));
  const result = await mixin.account.transfer(
    currencyMap[currency], mixinAccountId, amount, memo, {
      pin: mixinPin,
      aesKey: mixinAesKey,
      client_id: mixinClientId,
      session_id: mixinSessionId,
      privateKey: mixinPrivateKey
    },
    traceId
  );
  assertFault(result && result.data, `Errors.ERR_WALLET_FAIL_TO_ACCESS_MIXIN_WALLET: ${JSON.stringify(result.error)}`);
  // result.data.viewToken = getViewToken(result.data.snapshot_id);
  return result.data;
};

exports.getBalanceByUserId = async (userId, currency) => {
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  const wallet = await Wallet.getByUserId(userId);
  const resp = await getAsset({
    currency,
    clientId: wallet.mixinClientId,
    sessionId: wallet.mixinSessionId,
    privateKey: wallet.mixinPrivateKey,
  });
  return Number(resp.balance);
}

const getAsset = async (data = {}) => {
  const {
    currency,
    clientId,
    sessionId,
    privateKey
  } = data;
  assert(currency, Errors.ERR_IS_REQUIRED('currency'));
  assert(clientId, Errors.ERR_IS_REQUIRED('clientId'));
  assert(sessionId, Errors.ERR_IS_REQUIRED('sessionId'));
  assert(privateKey, Errors.ERR_IS_REQUIRED('privateKey'));
  let raw = await mixin.account.readAssets(currencyMap[currency], {
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

const updateByUuid = async (receipt, uuid) => {
  assert(receipt && Object.keys(receipt).length, Errors.ERR_IS_INVALID('receipt'));
  assert(receipt.raw || receipt.toRaw, Errors.ERR_IS_INVALID('receipt raw'));
  if (receipt.raw) {
    receipt.raw = JSON.stringify(receipt.raw);
  }
  if (receipt.toRaw) {
    receipt.toRaw = JSON.stringify(receipt.toRaw);
  }
  assert(uuid, Errors.ERR_IS_REQUIRED('uuid'));
  console.log(` ------------- receipt ---------------`, receipt);
  await Receipt.update(receipt, {
    where: {
      uuid
    }
  });
  // try {
  //   const resp = await utility.execute(sql, values);
  //   if (options.quick) {
  //     return resp;
  //   }
  //   const objReceipt = await util.promisify(getByUuid)(receipt.uuid || uuid, options);
  //   if (
  //     objReceipt &&
  //     objReceipt.forFileRId &&
  //     objReceipt.type === 'AWARD' &&
  //     objReceipt.status === 'SUCCESS'
  //   ) {
  //     const {
  //       list,
  //       total
  //     } = await exports.getTransactionsByFileRId(objReceipt.forFileRId, 'SUCCESS');
  //     const rewardAmount = R.reduce(mathjs.add, 0, R.map(item => mathjs.bignumber(item.amount))(list));
  //     const file = await updateCache(objReceipt.forFileRId, {
  //       rewardAmount: bigFormat(rewardAmount),
  //       rewardCount: total
  //     });
  //     if (options.enabledNotification) {
  //       socketIo.sendToAddress([
  //         objReceipt.fromAddress,
  //         objReceipt.toAddress
  //       ], 'file', file);
  //       const rewarder = await User.pGetById(objReceipt.fromAddress, null);
  //       socketIo.sendToAddress([
  //         objReceipt.fromAddress,
  //         objReceipt.toAddress
  //       ], 'rewarder', rewarder);
  //     }
  //   }
  //   if (objReceipt && options.enabledNotification) {
  //     sendTransationAndBalanceToAddress(objReceipt);
  //   }
  //   return objReceipt;
  // } catch (e) {
  //   assert(null, e);
  // }
};

const saveSnapshots = async (snapshots, options) => {
  const tasks = [];
  for (const snapshot of snapshots) {
    tasks.push(saveSnapshot(snapshot, options));
  }
  await Promise.all(tasks);
};

const saveSnapshot = async (snapshot, options) => {
  if (snapshot &&
    snapshot.type === 'snapshot' &&
    snapshot.source === 'TRANSFER_INITIALIZED') {
    const receipt = {
      status: 'SUCCESS'
    };
    const amount = Number(snapshot.amount);
    if (amount > 0) { // receive
      receipt.toRaw = JSON.stringify(snapshot);
      receipt.toSnapshotId = snapshot.snapshot_id;
      receipt.fromProviderUserId = snapshot.opponent_id;
      receipt.toProviderUserId = snapshot.user_id;
    } else if (amount < 0) { // pay
      receipt.raw = JSON.stringify(snapshot);
      receipt.snapshotId = snapshot.snapshot_id;
      receipt.fromProviderUserId = snapshot.user_id;
      receipt.toProviderUserId = snapshot.opponent_id;
    } else {
      return snapshot;
    }

    // // Added viewToken in transfer method.
    // if (
    //   !snapshot.data.includes('Pay for contract order') &&
    //   !snapshot.data.includes('Pay for files on PRESS.one') &&
    //   !snapshot.data.includes('SYSTEM task reward from') &&
    //   !snapshot.data.includes('Manual task reward from') &&
    //   !snapshot.data.includes('Coupon redeem')
    // ) {
    //   const snapshotId = snapshot.snapshot_id;
    //   receipt.viewToken = getViewToken(snapshotId);
    // }
    try {
      await updateByUuid(receipt, snapshot.trace_id, options);
    } catch (e) {
      console.log(e);
    }
  }
  return snapshot;
};

exports.syncMixinSnapshots = async () => {
  console.log(` ------------- syncMixinSnapshots ---------------`);
  try {
    let session = {};
    try {
      session = JSON.parse(fs.readFileSync('session.json', 'utf8'));
    } catch (err) {
      const current = new Date();
      session = {
        offset: current.toISOString()
      };
      const json = JSON.stringify(session);
      fs.writeFileSync('session.json', json, 'utf8');
    };
    const tasks = Object.keys(currencyMap).map(currency => {
      return mixin.readSnapshots(
        rfc3339nano.adjustRfc3339ByNano(session.offset, 1),
        currencyMap[currency],
        '50',
        'ASC'
      )
    })
    const results = await Promise.all(tasks);
    console.log(`Sync mixin snapshots start at: `, session.offset);
    const snapshots = [];
    for (const result of results) {
      const {
        data
      } = result;
      for (const i in data) {
        session.offset = data[i].created_at;
        if (data[i].user_id) {
          snapshots.push(data[i]);
        }
        const json = JSON.stringify(session);
        fs.writeFileSync('session.json', json, 'utf8');
      }
    }
    await saveSnapshots(snapshots);
    return snapshots;
  } catch (err) {
    throw err;
  }
};

exports.getReceiptsByUserAddress = async (userAddress, options = {}) => {
  assert(userAddress, Errors.ERR_IS_REQUIRED('userAddress'));
  const {
    offset = 0, limit, status
  } = options;
  const receipts = await Receipt.findAll({
    where: {
      [Op.or]: [{
        fromAddress: userAddress
      }, {
        toAddress: userAddress
      }],
      status
    },
    offset,
    limit
  });
  return receipts.map(receipt => receipt.toJSON());
}