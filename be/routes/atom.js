const router = require('koa-router')();
const {
  get
} = require('../controllers/apiAtom');
const {
  ensureAuthorization
} = require('../models/api');

router.get('/', ensureAuthorization({
  strict: false
}), get);

module.exports = router;