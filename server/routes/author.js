var router = require('koa-router')();
const {
  get,
  listRecommended
} = require('../controllers/apiAuthor');

const {
  ensureAuthorization,
} = require('../middleware/api');

router.get('/recommended', listRecommended);
router.get('/:id', ensureAuthorization({ strict: false }), get);

module.exports = router;