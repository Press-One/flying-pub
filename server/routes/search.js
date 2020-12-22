var router = require('koa-router')();
const {
  get,
  post,
  del,
} = require('../controllers/apiSearch');

router.get('/', get);
router.post('/', post);
router.del('/', del);

module.exports = router;
