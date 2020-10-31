var router = require('koa-router')();
const {
  subscribe,
  unsubscribe,
  listFollowing,
  listFollowers
} = require('../controllers/apiSubscription');
const { ensureAuthorization } = require('../middleware/api');

router.get('/:authorAddress/following', ensureAuthorization({ strict: false }), listFollowing);
router.get('/:authorAddress/followers', ensureAuthorization({ strict: false }), listFollowers);
router.post('/:authorAddress', ensureAuthorization(), subscribe);
router.del('/:authorAddress', ensureAuthorization(), unsubscribe);

module.exports = router;