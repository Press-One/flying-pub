const config = require('../config');
const router = require('koa-router')();
const {
  list,
  listBySubscriptions,
  listByUserSettings,
  get,
  update,
  listTopics
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
router.get('/by_user_settings', ensureAuthorization({ strict: isPrivate }), listByUserSettings);
router.get('/:id', ensureAuthorization({
  strict: isPrivate
}), get);
router.put('/:id', ensureAuthorization(), ensureAdmin(), update);
router.get('/:id/topics', listTopics);

module.exports = router;