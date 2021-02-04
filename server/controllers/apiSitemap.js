const Post = require('../models/sequelize/post');
const config = require('../config');

exports.get = async ctx => {
  try {
    let filterParam = {
      order: [['updatedAt', 'DESC']],
      limit: 50000,
      where: {
        deleted: false,
        invisibility: false
      },
    }
    const posts = await Post.findAll(filterParam);
    ctx.body = posts.reduce((text, post) => `${text}\n${config.serviceRoot}/posts/${post.rId}`, `${config.serviceRoot}/`);
  } catch(e) {
    console.log(e);
  }
};

