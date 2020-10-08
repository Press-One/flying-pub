const router = require('koa-router')();
const {
  ensureAuthorization
} = require('../middleware/api');

const {
  getBalance,
  withdraw,
  getReceipts,
  updateCustomPin,
  isCustomPinExist,
  validatePin,
} = require('../controllers/apiReaderFinance');

router.get('/balance', ensureAuthorization(), getBalance);
router.post('/withdraw', ensureAuthorization(), withdraw);
router.get('/receipts', ensureAuthorization(), getReceipts);
router.post('/pin', ensureAuthorization(), updateCustomPin);
router.get('/pin/exist', ensureAuthorization(), isCustomPinExist);
router.post('/pin/validate', ensureAuthorization(), validatePin);


module.exports = router;