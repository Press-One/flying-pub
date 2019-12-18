const Block = require('../models/sequelize/block');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

exports.list = async ctx => {
  const blocks = await Block.findAll({
    where: {
      blockNum: {
        [Op.ne]: null
      }
    }
  });
  const map = {};
  for (const block of blocks) {
    const json = block.toJSON();
    map[json.id] = json.user_address;
  }
  ctx.body = map;
}