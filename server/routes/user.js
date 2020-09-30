var router = require('koa-router')();
const {
  get,
  put,
  setPassword,
} = require('../controllers/apiUser');
const {
  ensureAuthorization,
} = require('../middleware/api');

router.get('/', ensureAuthorization(), get);
router.put('/', ensureAuthorization(), put);
router.put('/password', ensureAuthorization(), setPassword);

module.exports = router;