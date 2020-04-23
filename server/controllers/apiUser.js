exports.get = async ctx => {
  const {
    user
  } = ctx.verification;
  ctx.body = user;
};