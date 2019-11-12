const Post = require('../models/post');

exports.list = async ctx => {
  const result = await Post.list();
  ctx.body = {
    posts: result
  };
}