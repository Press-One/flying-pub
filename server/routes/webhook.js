const router = require('koa-router')();
const {
  mediumCallback,
} = require('../controllers/apiWebhook');

router.post('/medium', mediumCallback);

module.exports = router;