const Author = require('../models/author');
const {
  assert,
  Errors
} = require('../utils/validator');

exports.get = async ctx => {
  const address = ctx.params.id;
  const author = await Author.getByAddress(address);
  assert(author, Errors.ERR_NOT_FOUND('author'))
  ctx.body = author;
}