const config = require('../config');
const router = require('koa-router')();
const {
  list,
  listBySubscriptions,
  listByUserSettings,
  get,
  update,
  listTopics,
  favorite,
  unfavorite,
  listFavorites
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
router.get('/favorite', ensureAuthorization(), listFavorites);
router.get('/by_user_settings', ensureAuthorization({ strict: isPrivate }), listByUserSettings);
router.get('/:id', ensureAuthorization({
  strict: isPrivate
}), get);
router.put('/:id', ensureAuthorization(), ensureAdmin(), update);
router.get('/:id/topics', ensureAuthorization({ strict: false }), listTopics);
router.post('/:id/favorite', ensureAuthorization(), favorite);
router.post('/:id/unfavorite', ensureAuthorization(), unfavorite);

module.exports = router;