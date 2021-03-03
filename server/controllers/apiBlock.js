const Block = require("../models/block");
const {
  assert,
  Errors,
} = require('../utils/validator');

exports.getBlock = async ctx => {
  const block = await Block.get(ctx.params.id);
  assert(block, Errors.ERR_NOT_FOUND("block"));
  ctx.body = block;
}
