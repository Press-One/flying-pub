var router = require('koa-router')();
const {
  list
} = require('../controllers/apiPost');

router.get('/', list);

module.exports = router;