var router = require('koa-router')();
const {
  get,
  create,
  destroy,
  list
} = require('../controllers/apiSubscription');

router.get('/', list);
router.post('/', create);
router.get('/:id', get);
router.del('/:id', destroy);

module.exports = router;