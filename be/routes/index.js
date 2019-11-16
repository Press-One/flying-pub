var router = require('koa-router')();

router.get('/', async function (ctx) {
  ctx.body = '飞帖'
})

module.exports = router;