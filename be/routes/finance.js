const router = require('koa-router')();
const {
  getBalance,
  recharge,
  withdraw,
  getReceipts,
} = require('../controllers/finance');

router.get('/balance', getBalance);
router.post('/recharge', recharge);
router.post('/withdraw', withdraw);
router.get('/receipts', getReceipts);

module.exports = router;