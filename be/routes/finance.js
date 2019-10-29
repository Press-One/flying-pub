const router = require('koa-router')();
const {
  getBalance,
  recharge,
  withdraw,
  getReceipts,
  updateCustomPin,
  isCustomPinExist
} = require('../controllers/finance');

router.get('/balance', getBalance);
router.post('/recharge', recharge);
router.post('/withdraw', withdraw);
router.get('/receipts', getReceipts);
router.post('/pin', updateCustomPin);
router.get('/isCustomPinExist', isCustomPinExist);

module.exports = router;