var router = require('koa-router')();
const {
  get,
  post,
  del,
} = require('../controllers/apiSearch');
const {
  ensureAdmin,
} = require('../middleware/api');

router.get('/',  get);
router.post('/', ensureAdmin(), post);
router.del('/', ensureAdmin(), del);

module.exports = router;
