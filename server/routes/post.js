const config = require('../config');
const router = require('koa-router')();
const {
  listBySubscription,
  listByPopularity,
  listByPubDate,
  listByLatestComment,
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

const isPrivate = config.settings['permission.isPrivate'] || false;

router.get('/', ensureAuthorization({
  strict: isPrivate,
}), listByPubDate);
router.get('/popularity', ensureAuthorization({
  strict: isPrivate,
}), listByPopularity);
router.get('/latest_comment', ensureAuthorization({
  strict: isPrivate,
}), listByLatestComment);
router.get('/subscription', ensureAuthorization(), listBySubscription);
router.get('/favorite', ensureAuthorization(), listFavorites);
router.get('/:id', ensureAuthorization({
  strict: isPrivate
}), get);
router.put('/:id', ensureAuthorization(), ensureAdmin(), update);
router.get('/:id/topics', ensureAuthorization({ strict: false }), listTopics);
router.post('/:id/favorite', ensureAuthorization(), favorite);
router.post('/:id/unfavorite', ensureAuthorization(), unfavorite);

module.exports = router;