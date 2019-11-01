var router = require('koa-router')();
const {
  create,
  update
} = require('../controllers/vote');

router.post('/', create);
router.put('/', update);

module.exports = router;