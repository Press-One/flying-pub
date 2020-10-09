const Block = require("../models/block");

exports.listPending = async ctx => {
  const {
    offset = 0, limit = 5
  } = ctx.query;
  const pendingBlocks = await Block.listPending({
    offset,
    limit
  });
  ctx.body = pendingBlocks;
}