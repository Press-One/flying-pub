const Block = require('../models/sequelize/block');
const File = require('./file');
const {
  assert,
  Errors
} = require('../utils/validator');
const {
  log
} = require('../utils');
const request = require('request-promise');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

exports.get = async id => {
  assert(id, Errors.ERR_IS_REQUIRED('id'));
  const block = await Block.findOne({
    where: {
      id,
    }
  });
  return block ? block.toJSON() : null;
};

const syncBlockLog = (message) => {
  log(`【同步区块】: ${message}`)
}

exports.create = async (block) => {
  const dbBlock = await Block.create(block);
  return dbBlock.toJSON();
}

exports.update = async (id, data) => {
  assert(id, Errors.ERR_IS_REQUIRED('id'));
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  assert(data.blockNum, Errors.ERR_IS_REQUIRED('blockNum'));
  assert(data.blockTransactionId, Errors.ERR_IS_REQUIRED('blockTransactionId'));
  await Block.update({
    blockNum: data.blockNum,
    blockTransactionId: data.blockTransactionId
  }, {
    where: {
      id
    }
  });
  const file = await File.getByRId(id);
  assert(file, Errors.ERR_NOT_FOUND('file'));
  return true;
};

const getBlock = (rId) => {
  return request({
    uri: `https://press.one/api/v2/blocks/${rId}`,
    json: true,
    timeout: 10000,
    headers: {
      accept: 'application/json'
    },
  }).promise();
}

exports.getAllowBlock = async (topicAddress, address) => {
  const block = await Block.findOne({
    where: {
      data: {
        [Op.like]: `%"allow":"${address}","topic":"${topicAddress}"%`
      }
    }
  });
  return block ? block.toJSON() : null;
}

exports.sync = async () => {
  const dbUnSyncBlock = await Block.findOne({
    where: {
      blockNum: null,
      blockTransactionId: null,
      data: {
        [Op.or]: [{
            [Op.like]: `%"allow":%`
          },
          {
            [Op.like]: `%"deny":%`
          }
        ]
      }
    }
  });
  if (!dbUnSyncBlock) {
    syncBlockLog('暂时没有需要同步的区块');
    return;
  }
  const unSyncBlock = dbUnSyncBlock.toJSON();
  const latestBlocks = await getBlock(unSyncBlock.id);
  const latestBlock = latestBlocks[0];
  assert(latestBlock, Errors.ERR_NOT_FOUND('latestBlock'));
  syncBlockLog(`区块ID，${latestBlock.id}`)
  const {
    blockNum,
    blockTransactionId
  } = latestBlock;
  const isUnSynced = !blockNum || !blockTransactionId;
  if (isUnSynced) {
    syncBlockLog('区块没有 blockNum 或者 blockTransactionId，本次同步失败，开始尝试下一次...');
    return;
  }
  await Block.update({
    blockNum,
    blockTransactionId
  }, {
    where: {
      id: unSyncBlock.id
    }
  })
}

exports.listPending = async (pagination) => {
  const pendingPostBlocks = await Block.findAll({
    where: {
      blockNum: null,
      blockTransactionId: null,
      data: {
        [Op.like]: `%"file_hash":%`
      },
    },
    ...pagination
  });
  const list = await Promise.all(
    pendingPostBlocks.map(async (block) => {
      const file = await File.getByRId(block.id, {
        withRawContent: true
      });
      const blockJson = block.toJSON();
      blockJson.file = file;
      return blockJson;
    })
  )
  return list.filter(block => block.file);
}