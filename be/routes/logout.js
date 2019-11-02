var router = require('koa-router')();
const {
  logout
} = require('../controllers/apiLogout');

router.get('/', logout);

module.exports = router;