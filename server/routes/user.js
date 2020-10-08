var router = require('koa-router')();
const {
  get,
  getPublicUser,
  put,
  setPassword,
} = require('../controllers/apiUser');
const {
  ensureAuthorization,
} = require('../middleware/api');

router.get('/', ensureAuthorization(), get);
router.get('/:id', getPublicUser);
router.put('/', ensureAuthorization(), put);
router.put('/password', ensureAuthorization(), setPassword);

module.exports = router;