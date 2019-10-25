const router = require('koa-router')();
const {
  getBalance,
  recharge,
} = require('../controllers/finance');

router.get('/balance', getBalance);
router.post('/recharge', recharge);

module.exports = router;