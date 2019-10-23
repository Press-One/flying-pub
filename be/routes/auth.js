const router = require('koa-router')();
const {
  oauthLogin,
  oauthCallback
} = require('../controllers/auth');

router.get('/:provider/login', oauthLogin);
router.get('/:provider/callback', oauthCallback);

module.exports = router;