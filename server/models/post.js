const Sequelize = require('sequelize');
const {
  Op
} = Sequelize;
const moment = require('moment');
const Post = require('./sequelize/post');
const Author = require('./sequelize/author');
const {
  packAuthor
} = require('./author');
const Vote = require('./vote');
const {
  Joi,
  assert,
  Errors,
  attempt
} = require('../utils/validator');

const packPost = async (post, options = {}) => {
  assert(post, Errors.ERR_NOT_FOUND('post'));
  const {
    userId,
    withVoted = false,
    withContent = false,
    withPaymentUrl = false,
    dropAuthor = false
  } = options;
  delete post.userAddress;
  delete post.id;
  delete post.createdAt;
  delete post.updatedAt;
  if (!withPaymentUrl) {
    delete post.paymentUrl;
  }
  if (!withContent) {
    delete post.content;
  }
  if (dropAuthor) {
    delete post.author;
  }
  if (post.author) {
    post.author = packAuthor(post.author);
  }
  if (withVoted) {
    const voted = !!userId && await Vote.isVoted(userId, 'posts', post.rId);
    post.voted = voted;
  }
  post.upVotesCount = ~~post.upVotesCount;
  post.commentsCount = ~~post.commentsCount;
  return post;
}

const getByRId = async (rId, options = {}) => {
  assert(rId, Errors.ERR_IS_REQUIRED('rId'))
  const {
    includeAuthor = true
  } = options;
  const query = {
    where: {
      rId,
      deleted: false,
      invisibility: false
    }
  };
  const {
    ignoreDeleted,
    ignoreInvisibility
  } = options;
  if (ignoreInvisibility) {
    delete query.where.invisibility;
  }
  if (ignoreDeleted) {
    delete query.where.deleted;
  }
  if (includeAuthor) {
    query.include = [{
      model: Author,
      where: {
        status: 'allow'
      }
    }];
  }
  const post = await Post.findOne(query);
  return post ? await packPost(post.toJSON(), options) : null;
}
exports.getByRId = getByRId;

const updateByRId = async (rId, data) => {
  assert(rId, Errors.ERR_IS_REQUIRED('rId'))
  assert(data, Errors.ERR_IS_REQUIRED('data'))
  data = attempt(data, {
    rewardSummary: Joi.any().optional(),
    upVotesCount: Joi.number().optional(),
    commentsCount: Joi.number().optional(),
    latestRId: Joi.any().optional(),
    deleted: Joi.boolean().optional(),
    sticky: Joi.boolean().optional(),
    status: Joi.string().optional(),
    invisibility: Joi.bool().optional()
  });
  await Post.update(data, {
    where: {
      rId
    }
  });
  return true;
}
exports.updateByRId = updateByRId;

exports.updateLatestRId = async (latestRId, newLatestRId) => {
  assert(latestRId, Errors.ERR_IS_REQUIRED('latestRId'))
  assert(newLatestRId, Errors.ERR_IS_REQUIRED('newLatestRId'))
  await Post.update({
    latestRId: newLatestRId
  }, {
    where: {
      latestRId
    }
  });
}

const getOrder = orderBy => {
  const orderMap = {
    'PUB_DATE': ['pubDate', 'DESC'],
    'POPULARITY': [Sequelize.literal('"upVotesCount" + "commentsCount" * 0.6'), 'DESC']
  };
  return orderMap[orderBy] || orderMap['PUB_DATE'];
}

exports.list = async (options = {}) => {
  const {
    addresses,
    offset = 0,
    limit = 20,
    order = 'PUB_DATE',
    dropAuthor = false,
    dayRange,
    filterBan,
    filterSticky = false
  } = options;
  const where = {
    deleted: false,
    invisibility: false
  };
  const byAddress = addresses && addresses.length > 0;
  if (byAddress) {
    where.userAddress = addresses;
  }
  if (dayRange) {
    where.pubDate = {
      [Op.gte]: moment().subtract(~~dayRange, 'days').toDate()
    }
  }
  if (filterBan) {
    where.deleted = true;
    where.latestRId = null
  }
  if (filterSticky) {
    where.sticky = true;
  }
  const posts = await Post.findAll({
    where,
    offset,
    limit,
    include: [{
      model: Author,
      where: {
        status: 'allow'
      }
    }],
    order: [getOrder(order)]
  });
  const list = await Promise.all(
    posts.map(post => {
      return packPost(post.toJSON(), {
        dropAuthor,
      });
    })
  );
  return list;
}

exports.create = async data => {
  assert(data, Errors.ERR_IS_REQUIRED('data'))
  const verifiedData = attempt(data, {
    rId: Joi.string().trim(),
    userAddress: Joi.string().trim(),
    title: Joi.string().trim(),
    content: Joi.string().trim(),
    paymentUrl: Joi.optional(),
    pubDate: Joi.date(),
    status: Joi.string().trim(),
  });
  await Post.create(verifiedData);
  return true;
}

exports.delete = async rId => {
  assert(rId, Errors.ERR_IS_REQUIRED('rId'));
  await updateByRId(rId, {
    deleted: true
  });
  return true;
};
exports.getPostCountByAuthor = async (address) => {
  assert(address, Errors.ERR_IS_REQUIRED('address'))
  const query = {
    where: {
      userAddress: address,
      deleted: false,
      invisibility: false
    }
  };
  const count = await Post.count(query);
  return count ? count : 0;
}