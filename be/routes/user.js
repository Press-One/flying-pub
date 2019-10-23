var router = require('koa-router')();
const {
  get
} = require('../controllers/user');

router.get('/', get);

module.exports = router;