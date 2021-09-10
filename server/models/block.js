const Block = require('../models/sequelize/block');
const {
  assert,
  Errors
} = require('../utils/validator');
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

exports.getPendingBlocks = async (options = {}) => {
  const blocks = await Block.findAll({
    where: {
      blockHash: null,
    },
    limit: options.limit || 10
  });
  return blocks.map(block => block.toJSON());
};

exports.create = async (block) => {
  const dbBlock = await Block.create(block);
  return dbBlock.toJSON();
}

exports.update = async (id, data) => {
  assert(id, Errors.ERR_IS_REQUIRED('id'));
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  await Block.update({
    hash: data.hash,
    signature: data.signature,
    blockNumber: data.blockNumber,
    blockHash: data.blockHash
  }, {
    where: {
      id
    }
  });
  return true;
};

exports.getAllowBlock = async (topic, address) => {
  const block = await Block.findOne({
    where: {
      data: {
        [Op.like]: `%"allow":"${address}","topic":"${topic}"%`
      }
    }
  });
  return block ? block.toJSON() : null;
}
