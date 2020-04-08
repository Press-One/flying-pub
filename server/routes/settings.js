var router = require('koa-router')();
const {
  get,
  upsert,
} = require('../controllers/apiSettings');

router.get('/', get);
router.put('/', upsert);

module.exports = router;