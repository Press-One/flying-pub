var router = require('koa-router')();

router.get('/', async function (ctx) {
  ctx.body = '飞贴'
})

module.exports = router;