const router = require('koa-router')();
const {
  getBalance,
  recharge,
  withdraw,
  getReceipts,
  updateCustomPin,
  isCustomPinExist,
  validatePin
} = require('../controllers/finance');

router.get('/balance', getBalance);
router.post('/recharge', recharge);
router.post('/withdraw', withdraw);
router.get('/receipts', getReceipts);
router.post('/pin', updateCustomPin);
router.get('/pin/exist', isCustomPinExist);
router.post('/pin/validate', validatePin);

module.exports = router;