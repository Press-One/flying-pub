const Sequelize = require('sequelize');
const {
  Op
} = Sequelize;
const moment = require('moment');
const Post = require('./sequelize/post');
const File = require('./sequelize/file');
const { getTopicOrderQuery } = require('./topic');
const Topic = require('./sequelize/topic');
const Author = require('./sequelize/author');
const TopicContributionRequest = require('../models/sequelize/topicContributionRequest');
const User = require('./user');
const {
  packAuthor
} = require('./author');
const Vote = require('./vote');
const View = require('../models/view');
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
    withPaymentUrl = false,
    withTopic = true,
    dropAuthor = false,
    includeAuthor = true
  } = options;
  const postJson = post.toJSON();

  if (withTopic) {
    postJson.topics = await post.getTopics({
      where: {
        deleted: false
      },
      ...getTopicOrderQuery({
        attributes: ['uuid', 'name', 'deleted']
      }),
      joinTableAttributes: []
    });
  }

  delete postJson.userAddress;
  delete postJson.id;
  delete postJson.createdAt;
  delete postJson.updatedAt;
  if (!withPaymentUrl) {
    delete postJson.paymentUrl;
  }
  if (includeAuthor) {
    if (dropAuthor) {
      delete postJson.author;
    } else {
      if (!postJson.author.nickname) {
        const authorUser = await User.getByAddress(postJson.author.address);
        postJson.author.nickname = authorUser.nickname;
        postJson.author.avatar = authorUser.avatar;
        postJson.author.cover = authorUser.cover;
        postJson.author.bio = authorUser.bio;
      }
    }
    if (postJson.author) {
      postJson.author = await packAuthor(postJson.author);
    }
  }
  if (withVoted) {
    const voted = !!userId && await Vote.isVoted(userId, 'posts', postJson.rId);
    postJson.voted = voted;
  }
  postJson.upVotesCount = ~~postJson.upVotesCount;
  postJson.commentsCount = ~~postJson.commentsCount;

  if (options.withPendingTopicUuids) {
    const topicContributionRequests = await TopicContributionRequest.findAll({
      attributes: ['topicUuid'],
      where: {
        postRId: postJson.rId,
        status: 'pending'
      },
      raw: true
    });
    postJson.pendingTopicUuids = topicContributionRequests.map((t => t.topicUuid));
  }

  const cachedViewCount = await View.getCountByRId(postJson.rId);
  postJson.viewCount = cachedViewCount || ~~postJson.viewCount;

  const file = await File.findOne({
    attributes: ['id'],
    where: {
      rId: postJson.rId
    },
    raw: true
  });
  if (file) {
    postJson.fileId = ~~file.id;
  }

  return postJson;
}
exports.packPost = packPost;

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
  if (!options.withContent) {
    query.attributes = {
      exclude: ['content'],
    };
  }
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
  if (options.raw) {
    return post;
  }
  return post ? await packPost(post, options) : null;
}
exports.getByRId = getByRId;

exports.listByRIds = async (rIds, options = {}) => {
  assert(rIds, Errors.ERR_IS_REQUIRED('rIds'))
  const {
    includeAuthor = true
  } = options;
  const query = {
    attributes: {
      exclude: ['content'],
    },
    where: {
      rId: rIds,
      deleted: false,
      invisibility: false
    },
    order: [
      ['pubDate', 'DESC'],
    ],
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
  const posts = await Post.findAll(query);
  if (posts.length > 0) {
    return await Promise.all(posts.map(async post => {
      return await packPost(post, options)
    }))
  }
  return [];
}

exports.getLatestByRId = async (rId, options = {}) => {
  const rawPost = await Post.findOne({
    where: {
      rId
    }
  });
  if (!rawPost) {
    return null;
  }
  const latestPost = await getByRId(rawPost.latestRId || rawPost.rId, options);
  return latestPost;
}

const updateByRId = async (rId, data) => {
  assert(rId, Errors.ERR_IS_REQUIRED('rId'))
  assert(data, Errors.ERR_IS_REQUIRED('data'))
  data = attempt(data, {
    rewardSummary: Joi.any().optional(),
    upVotesCount: Joi.number().optional(),
    commentsCount: Joi.number().optional(),
    viewCount: Joi.number().optional(),
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
exports.getOrder = getOrder;

exports.list = async (options = {}) => {
  const {
    offset = 0,
    limit = 20,
    order = 'PUB_DATE',
    dropAuthor = false,
    dayRange,
    filterBan,
    filterSticky = false,
    addresses,
    topicUuids
  } = options;

  const queryOptions = {
    offset,
    limit,
    attributes: {
      exclude: ['content'],
    },
    include: [{
      model: Author,
      where: {
        status: 'allow'
      }
    }],
    order: [getOrder(order)]
  };

  const requiredWhere = {
    deleted: false,
    invisibility: false
  };
  let where = {
    ...requiredWhere
  };

  const isSubscription = addresses || topicUuids;
  if (isSubscription) {
    const addressWhere = {
      userAddress: addresses
    };
    const topicWhere = {
      '$topics.uuid$': topicUuids,
      '$topics.deleted$': false
    };

    if (addresses && !topicUuids) {
      where = {
        ...where,
        ...addressWhere
      };
    }

    if (!addresses && topicUuids) {
      where = {
        ...where,
        ...topicWhere
      }
    }

    if (addresses && topicUuids) {
      where = {
        ...where,
        [Op.or]: [addressWhere, topicWhere]
      }
    }
    
  } else {

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
  }

  queryOptions.where = where;

  let countOptions;
  let findOptions;
  if (topicUuids) {
    queryOptions.subQuery = false;
    const topicOptions = {
      model: Topic,
      as: 'topics',
      attributes: [],
      through: {
        attributes: [],
      }
    }
    queryOptions.include.push(topicOptions)
  }
  countOptions = queryOptions;
  findOptions = queryOptions;

  const [total, posts] = await Promise.all([
      Post.count(countOptions),
      Post.findAll(findOptions)
  ]);

  const derivedPosts = await Promise.all(
    posts.map(post => {
      return packPost(post, {
        dropAuthor,
        withPendingTopicUuids: options.withPendingTopicUuids
      });
    })
  );

  return { total, posts: derivedPosts };
}

exports.create = async data => {
  assert(data, Errors.ERR_IS_REQUIRED('data'))
  const verifiedData = attempt(data, {
    rId: Joi.string().trim(),
    userAddress: Joi.string().trim(),
    title: Joi.string().trim(),
    content: Joi.string().trim(),
    cover: Joi.string().empty('').optional(),
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

exports.SequelizePost = Post;