const Post = require('../models/post');

exports.list = async ctx => {
  const {
    user
  } = ctx.verification;
  const userId = user.id;
  const result = await Post.list({
    userId
  });
  ctx.body = {
    posts: result
  };
}