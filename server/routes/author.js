var router = require('koa-router')();
const {
  get,
  listRecommended
} = require('../controllers/apiAuthor');

const {
  ensureAuthorization,
} = require('../middleware/api');

router.get('/recommended', ensureAuthorization({ strict: false }), listRecommended);
router.get('/:id', ensureAuthorization({ strict: false }), get);

module.exports = router;