const Block = require('../models/block');
const {
  assert,
  Errors
} = require('../utils/validator');
const {
  log
} = require('../utils');

exports.mediumCallback = async (ctx) => {
  const {
    block
  } = ctx.request.body;
  assert(block, Errors.ERR_IS_REQUIRED('block'));
  const dbUnSyncBlock = await Block.get(block.id);
  assert(dbUnSyncBlock, Errors.ERR_NOT_FOUND('block'));
  log(`【同步区块】: 区块ID，${block.id}`);
  await Block.update(block.id, {
    blockNum: block.blockNum,
    blockTransactionId: block.blockTransactionId,
  });
  ctx.body = {
    success: true
  };
}