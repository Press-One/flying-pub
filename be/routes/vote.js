var router = require('koa-router')();
const {
  create,
  update
} = require('../controllers/apiVote');

router.post('/', create);
router.put('/', update);

module.exports = router;