var router = require('koa-router')();
const {
  ping
} = require('../controllers/apiPing');

router.get('/', ping);

module.exports = router;