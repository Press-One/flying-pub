const Mixin = require('../models/mixin');

exports.get = async ctx => {
  const {
    user
  } = ctx.verification;

  setTimeout(async () => {
    await Mixin.pushToNotifyQueue({
      userId: user.id,
      text: `文章《哈哈哈》已发布上链`,
      url: 'https://read.firesbox.com/posts/1cd03021fc4f09f0df74423e59f4acdda7034ff3ebce3e7193fdaf192733c2c1'
    });
  }, 5000);

  ctx.body = user;
};