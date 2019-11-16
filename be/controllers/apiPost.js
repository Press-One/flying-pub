const Post = require('../models/post');

exports.list = async ctx => {
  const userId = ctx.verification && ctx.verification.user.id;
  const result = await Post.list({
    userId
  });
  ctx.body = {
    posts: result
  };
}