const router = require('koa-router')();
const {
  allow,
  deny,
  getAllowPermissionList,
  getDenyPermissionList
} = require('../controllers/apiTopic');
const {
  ensureAuthorization,
  ensureAdmin,
} = require('../middleware/api');

router.get('/allow', ensureAuthorization(), ensureAdmin(), getAllowPermissionList);
router.get('/deny', ensureAuthorization(), ensureAdmin(), getDenyPermissionList);
router.post('/allow/:userAddress', ensureAuthorization(), ensureAdmin(), allow);
router.post('/deny/:userAddress', ensureAuthorization(), ensureAdmin(), deny);

module.exports = router;