const Post = require('./sequelize/post');
const {
  Joi,
  assert,
  Errors,
  attempt
} = require('../models/validator');

const get = async fileRId => {
  assert(fileRId, Errors.ERR_IS_REQUIRED('fileRId'))
  const post = await Post.findOne({
    where: {
      fileRId
    }
  });
  return post ? post.toJSON() : null;
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

exports.list = async () => {
  const posts = await Post.findAll();
  const list = posts.map((post) => {
    return post.toJSON();
  });
  return list;
};