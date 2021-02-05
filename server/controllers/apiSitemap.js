const Post = require('../models/sequelize/post');
const Log = require('../models/log');
const config = require('../config');

exports.get = async ctx => {
  const { ['user-agent']: userAgent } = ctx.request.header;
  Log.createAnonymity('站点地图',`${userAgent} is getting sitemap.txt`);
  try {
    let filterParam = {
      order: [['updatedAt', 'DESC']],
      limit: 49999,
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

