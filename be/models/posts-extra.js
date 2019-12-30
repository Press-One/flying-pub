const Post = require('./sequelize/posts-extra');
const Vote = require('./vote');
const {
  Joi,
  assert,
  Errors,
  attempt
} = require('../models/validator');

const packPost = async (post, options = {}) => {
  const {
    userId
  } = options;
  assert(post, Errors.ERR_NOT_FOUND('post'));
  const postJson = post.toJSON();
  const voted = !!userId && await Vote.isVoted(userId, 'posts', postJson.fileRId);
  postJson.voted = voted;
  return postJson;
}

const get = async (fileRId, options = {}) => {
  const {
    userId,
  } = options;
  assert(fileRId, Errors.ERR_IS_REQUIRED('fileRId'))
  const post = await Post.findOne({
    where: {
      fileRId
    }
  });
  return post ? await packPost(post, {
    userId
  }) : null;
}
exports.get = get;

exports.upsert = async (fileRId, data) => {
  assert(fileRId, Errors.ERR_IS_REQUIRED('fileRId'))
  assert(data, Errors.ERR_IS_REQUIRED('data'))
  data = attempt(data, {
    rewardSummary: Joi.string().trim().optional(),
    upVotesCount: Joi.number().optional(),
    commentsCount: Joi.number().optional()
  });
  const post = await get(fileRId);
  if (post) {
    await Post.update(data, {
      where: {
        fileRId
      }
    });
  } else {
    await Post.create({
      fileRId,
      ...data
    });
  }
  return true;
}

exports.list = async (options = {}) => {
  const {
    userId,
  } = options;
  const posts = await Post.findAll();
  const list = await Promise.all(posts.map((post) => {
    return packPost(post, {
      userId
    });
  }));
  return list;
};