var router = require('koa-router')();
const {
  listPending
} = require('../controllers/apiBlock');

router.get('/pending', listPending);

module.exports = router;