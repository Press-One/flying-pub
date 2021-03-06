const request = require('request-promise');
const PrsUtil = require('prs-utility');
const ip = require('ip');
const {
  mimeTypes
} = require('../utils');
const config = require('../config');
const Wallet = require('../models/wallet');
const {
  assert,
  throws,
  Errors
} = require('../utils/validator');
const Author = require('../models/author');
const Block = require('../models/block');
const {
  saveChainPost
} = require('../models/chainSync');
const Log = require('../models/log');
const prsAtm = require('prs-atm');
const uuidv4 = require('uuid/v4');

const HASH_ALG = 'sha256';

const signBlock = async data => {
  const block = Object.assign({}, data);
  try {
    const resp = await prsAtm.prsc.save(
      config.topic.chainAccount.account,
      config.topic.chainAccount.privateKey,
      block
    );
    return {
      ...data,
      blockTransactionId: resp.transaction_id
    };
  } catch (err) {
    console.log(err);
    const noBalance = err.message.includes('no balance') || err.message.includes('overdrawn balance');
    if (noBalance) {
      Log.createAnonymity('提交区块', '链上账号余额不足，无法提交区块', {
        toActiveMixinUser: true
      });
      throws({
        code: 'ERR_NO_ENOUGH_BALANCE',
        message: 'no enough balance of topic account'
      });
    }
    return null;
  }
};

const getPostfix = mimeType => {
  let postfix;
  for (const key in mimeTypes) {
    if (mimeTypes[key] === mimeType) {
      postfix = key;
      break;
    }
  }
  return postfix;
};

const getFileUrl = (file, origin) => {
  const name = file.msghash;
  const postfix = getPostfix(file.mimeType);
  const isDev = origin.includes('localhost');
  return `${
    isDev ? config.serviceRoot : origin
  }/api/storage/${name}.${postfix}`;
};

const getFilePayload = async ({
  file,
  user,
  topic
}, options = {}) => {
  assert(file, Errors.ERR_IS_REQUIRED('file'));
  assert(user, Errors.ERR_IS_REQUIRED('user'));
  assert(topic, Errors.ERR_IS_REQUIRED('topic'));

  const data = {
    file_hash: file.msghash,
    topic
  };

  const {
    updatedFile,
  } = options;
  if (updatedFile) {
    assert(updatedFile.block, Errors.ERR_IS_REQUIRED('updatedFile.block'));
    const rId = updatedFile.block.id;
    assert(rId, Errors.ERR_IS_REQUIRED('rId'));
    data.updated_tx_id = rId;
  }

  let meta = {
    hash_alg: HASH_ALG
  };
  const isNotDeletedFile = !!file.content;
  if (isNotDeletedFile) {
    const mixinWalletClientId = await Wallet.getMixinClientIdByUserAddress(
      user.address
    );
    assert(
      mixinWalletClientId,
      Errors.ERR_NOT_FOUND('user mixinWalletClientId')
    );
    meta = {
      uris: [getFileUrl(file, options.origin)],
      mime: `${file.mimeType};charset=UTF-8`,
      encryption: 'aes-256-cbc',
      payment_url: `mixin://transfer/${mixinWalletClientId}`,
      hash_alg: HASH_ALG
    };
  }

  const payload = {
    id: PrsUtil.sha256(uuidv4()),
    user_address: user.address,
    type: 'PIP:2001',
    meta,
    data,
    hash: PrsUtil.hashBlockData(data, HASH_ALG),
    signature: PrsUtil.signBlockData(data, user.privateKey, HASH_ALG).signature
  };
  return payload;
};

const getTopicPayload = (options = {}) => {
  const {
    userAddress,
    topic,
    type
  } = options;
  const data = {
    [type]: userAddress,
    topic: topic.address
  };
  const payload = {
    id: PrsUtil.sha256(uuidv4()),
    user_address: topic.address,
    type: 'PIP:2001',
    meta: {
      hash_alg: HASH_ALG
    },
    data,
    hash: PrsUtil.hashBlockData(data, HASH_ALG),
    signature: PrsUtil.signBlockData(data, topic.privateKey, HASH_ALG).signature
  };
  return payload;
};

const packBlock = block => {
  const result = {};
  for (const key in block) {
    const value = block[key];
    const isObj = typeof value === 'object';
    result[key] = isObj ? JSON.stringify(value) : value;
  }
  return result;
};

exports.pushFile = async (file, options = {}) => {
  const {
    user,
    updatedFile,
    origin
  } = options;
  const payload = await getFilePayload({
    file,
    user,
    topic: config.topic.address
  }, {
    updatedFile,
    origin: origin || config.serviceRoot
  });
  const block = await signBlock(payload);
  assert(block, Errors.ERR_NOT_FOUND('block'));

  const packedBlock = packBlock(block);
  const dbBlock = await Block.create(packedBlock);

  try {
    const chainPost = {
      ...payload,
      derive: {
        rawContent: file.content
      }
    }
    await saveChainPost(chainPost, {
      fromPublish: true
    });
  } catch (e) {
    console.log(e);
  }

  return dbBlock;
};

/**
 * @param {object} options
 * @param {number} options.userAddress
 * @param {string} options.topicAddress
 * @param {'allow' | 'deny'} [options.type]
 */
exports.pushTopic = async (options = {}) => {
  const {
    userAddress,
    topicAddress,
    type = 'allow'
  } = options;
  assert(userAddress, Errors.ERR_IS_REQUIRED('userAddress'));
  assert(topicAddress, Errors.ERR_IS_REQUIRED('topicAddress'));
  assert(['allow', 'deny'].includes(type), Errors.ERR_IS_INVALID('type'));
  const topic = config.topic;
  const payload = getTopicPayload({
    userAddress,
    type,
    topic
  });
  const block = await signBlock(payload);
  assert(block, Errors.ERR_NOT_FOUND('block'));

  try {
    await Author.upsert(userAddress, {
      status: type
    });
  } catch (e) {}

  const packedBlock = packBlock(block);
  const dbBlock = await Block.create(packedBlock);
  return dbBlock;
};