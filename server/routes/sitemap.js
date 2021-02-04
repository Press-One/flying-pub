var router = require('koa-router')();
const {
  get,
} = require('../controllers/apiSitemap');

router.get('/',  get);

module.exports = router;
