var router = require('koa-router')();
const {
  logout
} = require('../controllers/logout');

router.get('/', logout);

module.exports = router;