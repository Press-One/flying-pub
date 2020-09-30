const config = require('../config');
const router = require('koa-router')();
const {
  list,
  listBySubscriptions,
  get,
} = require('../controllers/apiPost');

const {
  ensureAuthorization,
} = require('../middleware/api');

const isPrivate = config.settings['permission.isPrivate'];

router.get('/', ensureAuthorization({
  strict: isPrivate,
  allowApiAccessKey: true
}), list);
router.get('/subscription', ensureAuthorization(), listBySubscriptions);
router.get('/:id', ensureAuthorization({
  strict: isPrivate
}), get);

module.exports = router;