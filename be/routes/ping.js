var router = require('koa-router')();
const {
  ping
} = require('../controllers/ping');

router.get('/', ping);

module.exports = router;