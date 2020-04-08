var router = require('koa-router')();
const {
  list,
} = require('../controllers/apiBlock');

router.get('/', list);

module.exports = router;