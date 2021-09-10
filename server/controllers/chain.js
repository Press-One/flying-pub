const {
  mimeTypes
} = require('../utils');
const config = require('../config');
const Wallet = require('../models/wallet');
const {
  assert,
  Errors
} = require('../utils/validator');
const Author = require('../models/author');
const Block = require('../models/block');
const {
  saveChainPost
} = require('../models/chain');
const Bistrot = require('bistrot');
const uuidv4 = require('uuid/v4');

const HASH_ALG = 'sha256';

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
    id: Bistrot.encryption.hash(uuidv4()),
    user_address: user.address,
    type: 'PIP:2001',
    meta,
    data
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
    id: Bistrot.encryption.hash(uuidv4()),
    user_address: topic.address,
    type: 'PIP:2001',
    meta: {
      hash_alg: HASH_ALG
    },
    data,
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
  const block = {
    id: payload.id,
    user_address: payload.user_address,
    type: payload.type,
    meta: payload.meta,
    data: payload.data,
    hash: '',
    signature: '',
  };

  const packedBlock = packBlock(block);
  const dbBlock = await Block.create(packedBlock);

  try {
    const chainPost = {
      ...block,
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

exports.pushTopicAuthorization = async (options = {}) => {
  const {
    userAddress,
    type = 'allow'
  } = options;
  assert(userAddress, Errors.ERR_IS_REQUIRED('userAddress'));
  assert(['allow', 'deny'].includes(type), Errors.ERR_IS_INVALID('type'));
  const topic = config.topic;
  const payload = getTopicPayload({
    userAddress,
    type,
    topic
  });

  try {
    await Author.upsert(userAddress, {
      status: type
    });
  } catch (e) {}

  const block = {
    id: payload.id,
    user_address: payload.user_address,
    type: payload.type,
    meta: payload.meta,
    data: payload.data,
    hash: '',
    signature: '',
  };

  const packedBlock = packBlock(block);
  const dbBlock = await Block.create(packedBlock);
  return dbBlock;
};