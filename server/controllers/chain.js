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

const signBlock = async data => {
  data = Object.assign({}, data);
  try {
    const resp = await prsAtm.prsc.signSave(
      data.type,
      data.meta,
      data.data,
      config.topic.account,
      config.topic.publicKey,
      config.topic.privateKey,
      {
        userAddress: data.user_address,
        privateKey: data.privateKey
      }
    );
    const block = resp.processed.action_traces[0].act.data;
    return {
      id: block.id,
      user_address: block.user_address,
      type: block.type,
      meta: block.meta,
      data: block.data,
      hash: block.hash,
      signature: block.signature,
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

const getFileData = async ({
  file,
  user,
}, options = {}) => {
  assert(file, Errors.ERR_IS_REQUIRED('file'));
  assert(user, Errors.ERR_IS_REQUIRED('user'));

  const data = {
    file_hash: file.msghash,
    topic: config.topic.account
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

  let meta = {};
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
    };
  }

  const payload = {
    user_address: user.address,
    type: 'PIP:2001',
    meta,
    data,
    privateKey: user.privateKey
  };
  return payload;
};

const getTopicAuthorizationData = (options = {}) => {
  const {
    userAddress,
    type
  } = options;
  const data = {
    [type]: userAddress,
    topic: config.topic.account
  };
  const payload = {
    user_address: config.topic.account,
    type: 'PIP:2001',
    meta: {},
    data,
    privateKey: config.topic.account.privateKey
  };
  return payload;
};

exports.pushFile = async (file, options = {}) => {
  const {
    user,
    updatedFile,
    origin
  } = options;
  const fileData = await getFileData({
    file,
    user,
  }, {
    updatedFile,
    origin: origin || config.serviceRoot
  });
  const block = await signBlock(fileData);
  assert(block, Errors.ERR_NOT_FOUND('block'));

  const dbBlock = await Block.create(block);

  try {
    const chainPost = {
      ...block,
      meta: JSON.parse(block.meta),
      data: JSON.parse(block.data),
      derive: {
        rawContent: file.content
      }
    }
    console.log({ chainPost });
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
  const topicAuthorizationData = getTopicAuthorizationData({
    userAddress,
    type,
  });
  const block = await signBlock(topicAuthorizationData);
  assert(block, Errors.ERR_NOT_FOUND('block'));

  try {
    await Author.upsert(userAddress, {
      status: type
    });
  } catch (e) {}

  const dbBlock = await Block.create(block);
  return dbBlock;
};