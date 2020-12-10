var router = require('koa-router')();
const {
  get,
} = require('../controllers/apiSearch');

router.get('/', get);

module.exports = router;
