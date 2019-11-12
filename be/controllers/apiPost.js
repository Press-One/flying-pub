const Post = require('../models/post');

exports.list = async ctx => {
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const result = await Post.list({
    offset,
    limit
  });
  ctx.body = {
    posts: result
  };
}