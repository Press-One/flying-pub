var router = require('koa-router')();
const {
  list
} = require('../controllers/apiPost');

const {
  ensureAuthorization
} = require('../models/api');

router.get('/', ensureAuthorization({
  strict: false
}), list);

module.exports = router;