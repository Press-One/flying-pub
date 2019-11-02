var router = require('koa-router')();
const {
  list,
  create,
  remove,
} = require('../controllers/apiComment');
const {
  ensureAuthorization
} = require('../models/api');

router.get('/', list);
router.post('/', ensureAuthorization(), create);
router.del('/:id', ensureAuthorization(), remove);

module.exports = router;