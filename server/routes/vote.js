var router = require('koa-router')();
const {
  create,
  delete: del
} = require('../controllers/apiVote');

router.post('/', create);
router.delete('/', del);

module.exports = router;