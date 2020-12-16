var router = require('koa-router')();
const {
  get,
  post,
} = require('../controllers/apiSearch');

router.get('/', get);
router.post('/', post);

module.exports = router;
