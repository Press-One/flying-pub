var router = require('koa-router')();
const {
  get,
  post,
  del,
  resync,
} = require('../controllers/apiSearch');
const {
  ensureAdmin,
} = require('../middleware/api');

router.get('/',  get);
router.post('/', ensureAdmin(), post);
router.post('/resync', ensureAdmin(), resync);
router.del('/', ensureAdmin(), del);

module.exports = router;
