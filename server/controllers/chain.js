const request = require('request-promise');
const PrsUtil = require('prs-utility');
const ip = require('ip');
const {
  mimeTypes
} = require('../utils');
const config = require('../config');
const User = require('../models/user');
const {
  assert,
  Errors
} = require('../utils/validator');
const Author = require('../models/author');
const Block = require('../models/block');
const {
  saveChainPost
} = require('../models/atom');

const SIGN_URL = `https://press.one/api/v2/datasign`;
const HASH_ALG = 'sha256';

const signBlock = data => {
  return request({
    method: 'post',
    uri: SIGN_URL,
    json: true,
    headers: {
      accept: 'application/json'
    },
    body: data
  }).promise();
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
  // using ip so that atom docker container can access it
  const ipRoot = `http://${ip.address()}:${config.port}`;
  return `${
    isDev ? ipRoot : origin
  }/api/storage/${name}.${postfix}`;
};

const getFilePayload = ({
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
    origin
  } = options;
  if (updatedFile) {
    assert(updatedFile.block, Errors.ERR_IS_REQUIRED('updatedFile.block'));
    const rId = updatedFile.block.id;
    assert(rId, Errors.ERR_IS_REQUIRED('rId'));
    data.updated_tx_id = rId;
  }

  assert(
    user.mixinWalletClientId,
    Errors.ERR_NOT_FOUND('user.mixinWalletClientId')
  );

  const payload = {
    user_address: user.address,
    type: 'PIP:2001',
    meta: {
      uris: [getFileUrl(file, origin)],
      mime: `${file.mimeType};charset=UTF-8`,
      encryption: 'aes-256-cbc',
      payment_url: `mixin://transfer/${user.mixinWalletClientId}`,
      hash_alg: HASH_ALG
    },
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
  delete block['createdAt'];
  for (const key in block) {
    const value = block[key];
    const isObj = typeof value === 'object';
    result[key] = isObj ? JSON.stringify(value) : value;
  }
  return result;
};

exports.pushFile = async (file, options = {}) => {
  const user = await User.get(file.userId, {
    withKeys: true
  });
  const {
    updatedFile,
    origin
  } = options;
  const payload = getFilePayload({
    file,
    user,
    topic: config.topic.address
  }, {
    updatedFile,
    origin: origin || config.serviceRoot
  });
  const block = await signBlock(payload);
  assert(block, Errors.ERR_NOT_FOUND('block'));

  try {
    const chainPost = {
      publish_tx_id: block.id,
      file_hash: block.data.file_hash,
      topic: block.data.topic,
      updated_tx_id: block.data.updated_tx_id || '',
      content: file.content,
      updated_at: block.createdAt,
      deleted: false
    }
    await saveChainPost(chainPost, {
      fromPublish: true
    });
  } catch (e) {
    console.log(e);
  }

  const packedBlock = packBlock(block);
  const dbBlock = await Block.create(packedBlock);
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
  } catch (e) {

  }

  const packedBlock = packBlock(block);
  const dbBlock = await Block.create(packedBlock);
  return dbBlock;
};