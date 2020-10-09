const config = require('../config');
const router = require('koa-router')();
const {
  list,
  listBySubscriptions,
  get,
  update
} = require('../controllers/apiPost');

const {
  ensureAuthorization,
  ensureAdmin,
} = require('../middleware/api');

const isPrivate = config.settings['permission.isPrivate'];

router.get('/', ensureAuthorization({
  strict: isPrivate,
}), list);
router.get('/subscription', ensureAuthorization(), listBySubscriptions);
router.get('/:id', ensureAuthorization({
  strict: isPrivate
}), get);
router.put('/:id', ensureAuthorization(), ensureAdmin(), update);

module.exports = router;