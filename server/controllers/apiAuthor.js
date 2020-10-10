const Author = require('../models/author');
const User = require("../models/user");
const {
  assert,
  Errors
} = require('../utils/validator');

exports.get = async ctx => {
  const address = ctx.params.id;
  const authorUser = await User.getByAddress(address);
  const author = await Author.getByAddress(address);
  assert(author, Errors.ERR_NOT_FOUND('author'))
  if (authorUser) {
    author.avatar = author.avatar || authorUser.avatar;
    author.name = author.name || authorUser.nickname;
    author.bio = author.bio || authorUser.bio;
  }
  ctx.body = author;
}