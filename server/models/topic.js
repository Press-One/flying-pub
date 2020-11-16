const {
  assert,
  Errors,
  attempt,
  Joi
} = require("../utils/validator");
const Topic = require("./sequelize/topic");
const Author = require('./sequelize/author');
const { packAuthors } = require('./author');
const Post = require('./sequelize/post');
const User = require("./user");
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const { immediatePromise } = require("../utils");

const pickTopic = async (topic, options = {}) => {
  const [
    followerCount,
    postCount,
    followerPreview,
    user,
    authors,
    followingTopicsCount
  ] = await Promise.all([
    topic.countFollowers(),
    topic.countPosts({
      where: {
        deleted: false,
        invisibility: false
      }
    }),
    topic.getFollowers({
      limit: options.summaryPreviewCount || 0,
      attributes: ['avatar'],
      joinTableAttributes: []
    }),
    User.get(topic.userId),
    options.withAuthor ? listAuthors(topic.uuid) : immediatePromise(),
    options.currentUser ? options.currentUser.countFollowingTopics({
      where: {
        deleted: false,
        uuid: topic.uuid
      }
    }): immediatePromise()
  ]);

  let derivedTopic = topic.toJSON();
  delete derivedTopic.id;
  delete derivedTopic.userId;
  derivedTopic = {
    ...derivedTopic,
    user,
    summary: {
      follower: {
        count: followerCount,
        preview: followerPreview.map(item => item.avatar)
      },
      post: {
        count: postCount
      }
    }
  }

  if (options.withAuthor) {
    derivedTopic.summary.author = {
      count: authors.length,
      preview: authors.slice(0, options.summaryPreviewCount || 0).map(item => item.avatar)
    }
  }

  if (options.currentUser) {
    derivedTopic.following = followingTopicsCount > 0;
  }

  return derivedTopic;
}
exports.pickTopic = pickTopic;

const listAuthors = async (uuid, options = {}) => {
  assert(uuid, Errors.ERR_IS_REQUIRED("uuid"));
  const authors = await Author.findAll({
    where: {
      status: "allow",
    },
    include: [{
      model: Post,
      attributes: [],
      required: true,
      include: [{
        model: Topic,
        as: 'topics',
        attributes: [],
        where: {
          deleted: false,
          uuid
        },
        through: {
          attributes: [],
        },
      }]
    }],
    offset: options.offset,
    limit: options.limit
  });
  return await packAuthors(authors);
}
exports.listAuthors = listAuthors;

exports.get = async (uuid, options = {}) => {
  assert(uuid, Errors.ERR_IS_REQUIRED("uuid"));
  const topic = await Topic.findOne({
    where: {
      uuid,
      deleted: false
    }
  });
  if (options.raw) {
    return topic;
  }
  if (!topic) {
    return null;
  }
  return await pickTopic(topic, options);
}

exports.create = async (user, data) => {
  assert(user, Errors.ERR_IS_REQUIRED("user"));
  assert(data, Errors.ERR_IS_REQUIRED("data"));
  attempt(data, {
    cover: Joi.string().trim(),
    name: Joi.string().trim(),
    description: Joi.string().trim(),
    contributionEnabled: Joi.bool(),
    reviewEnabled: Joi.bool()
  });
  const insertedTopicCount = await Topic.count({
    where: {
      name: data.name,
      deleted: false
    }
  });
  assert(insertedTopicCount === 0, Errors.ERR_IS_DUPLICATED('name'), 409);
  data.userId = user.id;
  const topic = await Topic.create(data);
  await user.addTopics(topic);
  await topic.addFollowers(user);
  return await pickTopic(topic, {
    currentUser: user
  });
}

exports.update = async (user, uuid, data) => {
  assert(user, Errors.ERR_IS_REQUIRED("user"));
  assert(uuid, Errors.ERR_IS_REQUIRED("uuid"));
  attempt(data, {
    cover: Joi.string().trim().optional(),
    name: Joi.string().trim().optional(),
    description: Joi.string().trim().optional(),
    contributionEnabled: Joi.bool().optional(),
    reviewEnabled: Joi.bool().optional()
  });
  const topicsCount = await user.countTopics({
    where: {
      uuid,
      deleted: false
    }
  });
  const isOwner = topicsCount > 0;
  assert(isOwner, Errors.ERR_NO_PERMISSION);
  await Topic.update(data, {
    where: {
      uuid
    }
  });
}

exports.remove = async (user, uuid) => {
  assert(uuid, Errors.ERR_IS_REQUIRED("uuid"));
  const topicsCount = await user.countTopics({
    where: {
      uuid,
      deleted: false
    }
  });
  const isOwner = topicsCount > 0;
  assert(isOwner, Errors.ERR_NO_PERMISSION);
  await Topic.update({
    deleted: true
  }, {
    where: {
      uuid
    }
  });
}

const getTopicOrderQuery = (options = {}) => {
  const attributes = options.attributes ? options.attributes : Object.keys(Topic.rawAttributes);
  attributes.push([Sequelize.literal('(SELECT COUNT(*) FROM "posts_topics" WHERE "posts_topics"."topicUuid" = "topics"."uuid")'), '"postCount"']);
  return {
    attributes,
    order: [[Sequelize.literal('"postCount"'), 'DESC NULLS LAST']]
  }
};
exports.getTopicOrderQuery = getTopicOrderQuery;

exports.listPublicTopics = async (options = {}) => {
  const { offset, limit } = options;
  const where = {
    deleted: false,
    contributionEnabled: true
  };
  if (options.currentUser) {
    where.userId = {
      [Op.not]: options.currentUser.id
    }
  }
  const result = await Topic.findAndCountAll({
    where,
    ...getTopicOrderQuery(),
    offset,
    limit,
  });
  const topics = await Promise.all(result.rows.map(topic => pickTopic(topic)));
  return {
    total: result.count,
    topics
  }
}

exports.SequelizeTopic = Topic;