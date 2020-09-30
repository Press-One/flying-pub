var router = require('koa-router')();
const {
  get,
} = require('../controllers/apiProfile');
const {
  ensureAuthorization,
} = require('../middleware/api');

router.get('/', ensureAuthorization(), get);

module.exports = router;