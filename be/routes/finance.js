const router = require('koa-router')();
const {
  recharge,
} = require('../controllers/finance');

router.post('/recharge', recharge);

module.exports = router;