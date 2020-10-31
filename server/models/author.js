const Sequelize = require('sequelize');
const Author = require('./sequelize/author');
const Log = require('./log');
const {
  Joi,
  assert,
  Errors,
  attempt
} = require('../utils/validator');

const packAuthor = author => {
  return {
    status: author.status,
    address: author.address,
    nickname: author.nickname,
    avatar: author.avatar,
    cover: author.cover,
    bio: author.bio
  };
}
exports.packAuthor = packAuthor;

const getByAddress = async (address, options = {}) => {
  assert(address, Errors.ERR_IS_REQUIRED('address'))
  const author = await Author.findOne({
    where: {
      address
    }
  });

  if (!author) {
    return null;
  }
  
  const derivedAuthor = packAuthor(author.toJSON());

  if (options.raw) {
    return author;
  }

  if (options.returnRaw) {
    return { sequelizeAuthor: author, author: derivedAuthor }
  }

  return derivedAuthor;
}
exports.getByAddress = getByAddress;

exports.upsert = async (address, data) => {
  assert(address, Errors.ERR_IS_REQUIRED('address'))
  assert(data, Errors.ERR_IS_REQUIRED('data'))
  const verifiedData = attempt(data, {
    status: Joi.string().empty('').optional(),
    nickname: Joi.string().empty('').optional(),
    avatar: Joi.string().empty('').optional(),
    cover: Joi.string().empty('').optional(),
    bio: Joi.string().empty('').optional()
  });
  const author = await getByAddress(address);
  if (author) {
    await Author.update(verifiedData, {
      where: {
        address
      }
    });
    if (data.status) {
      Log.createAnonymity('更新作者状态', `${address} ${data.status}`);
    } else {
      Log.createAnonymity('更新作者资料', `${address}`);
    }
  } else {
    verifiedData.status = verifiedData.status || 'allow';
    await Author.create({
      address,
      ...verifiedData
    });
    Log.createAnonymity('创建作者', `${address}`);
  }
  return true;
}

exports.listRecommended = async (options = {}) => {
  const { limit } = options;
  const authors = await Author.findAll({
    attributes: [
      'address', 'nickname', 'avatar', 'cover', 'bio',
      [Sequelize.literal('(SELECT SUM("posts"."upVotesCount") + SUM("posts"."commentsCount") * 0.6 FROM "posts" WHERE "posts"."userAddress" = "authors"."address")'), '"countSum"'],
    ],
    where: {
      status: 'allow',
      nickname: {
        [Sequelize.Op.not]: null
      }
    },
    order: [[Sequelize.literal('"countSum"'), 'DESC NULLS LAST']],
    limit
  });

  const derivedAuthors = await Promise.all(authors.map(author => packAuthor(author.toJSON())));

  return derivedAuthors;
}