const router = require('koa-router')();
const {
  getBalance,
  recharge,
  withdraw,
} = require('../controllers/finance');

router.get('/balance', getBalance);
router.post('/recharge', recharge);
router.post('/withdraw', withdraw);

module.exports = router;