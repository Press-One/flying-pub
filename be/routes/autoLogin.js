var router = require('koa-router')();
const {
  create,
  get,
  del,
} = require('../controllers/apiAutoLogin');

router.post('/', create);
router.get('/', get);
router.del('/', del);

module.exports = router;