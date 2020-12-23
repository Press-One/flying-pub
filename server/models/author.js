const Sequelize = require('sequelize');
const User = require("./user");
const Author = require('./sequelize/author');
const Log = require('./log');
const {
  Joi,
  assert,
  Errors,
  attempt
} = require('../utils/validator');

const packAuthor = async (author, options = {}) => {
  const user = await User.getByAddress(author.address) || {};
  const derivedAuthor = {
    status: author.status,
    address: author.address,
    nickname: user.nickname || author.nickname,
    avatar: user.avatar || author.avatar,
    cover: user.cover || author.cover,
    bio: user.bio || author.bio
  };
  if (options.withUserId) {
    derivedAuthor.userId = user.id;
  }
  if (options.withPrivateContributionEnabled) {
    derivedAuthor.privateContributionEnabled = user.privateContributionEnabled;
  }
  return derivedAuthor;
}
exports.packAuthor = packAuthor;

const packAuthors = async authors => {
  return await Promise.all(authors.map(async author => {
    return await packAuthor(author);
  }));
}
exports.packAuthors = packAuthors;

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
  
  if (options.raw) {
    return author;
  }

  const derivedAuthor = await packAuthor(author.toJSON(), options);

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

  const derivedAuthors = await packAuthors(authors);

  return derivedAuthors;
}

exports.SequelizeAuthor = Author;