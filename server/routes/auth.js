const router = require('koa-router')();
const {
  oauthLogin,
  oauthCallback
} = require('../controllers/apiAuth');

router.get('/:provider/login', oauthLogin);
router.get('/:provider/callback', oauthCallback);

module.exports = router;