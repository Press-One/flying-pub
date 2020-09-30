const router = require('koa-router')();
const {
  sendSmsCodeHandler,
  verifySmsCodeHandler,
  oauthLogin,
  oauthCallback,
  phoneBind,
  oauthBind,
  loginWithPassword,
  getPermission
} = require('../controllers/apiAuth');
const {
  ensureAuthorization
} = require('../middleware/api');

router.get('/permission', ensureAuthorization(), getPermission);
router.post('/phone/send_code', sendSmsCodeHandler);
router.post('/phone/verify_code', verifySmsCodeHandler);
router.post('/phone/password/login', loginWithPassword);
router.get('/:provider/login', oauthLogin);
router.get('/:provider/callback', ensureAuthorization({
  strict: false
}), oauthCallback);
router.post('/phone/bind', ensureAuthorization(), phoneBind);
router.get('/:provider/bind', ensureAuthorization(), oauthBind);

module.exports = router;