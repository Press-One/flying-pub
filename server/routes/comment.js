var router = require('koa-router')();
const {
  list,
  create,
  remove,
  batchCommentIds
} = require('../controllers/apiComment');
const {
  ensureAuthorization
} = require('../middleware/api');

router.get('/', ensureAuthorization({
  strict: false
}), list);
router.post('/', ensureAuthorization(), create);
router.del('/:id', ensureAuthorization(), remove);
router.get('/batch', batchCommentIds);

module.exports = router;