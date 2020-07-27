const config = require('../config');
const router = require('koa-router')();
const {
  get,
  notify,
} = require('../controllers/apiConversation');
const {
  assert,
  Errors,
} = require('../models/validator');

const checkApiAccessKey = () => {
  return async (ctx, next) => {
    const apiAccessKey = config.auth.apiAccessKey;
    assert(apiAccessKey === ctx.headers['x-api-access-key'], Errors.ERR_IS_INVALID('apiAccessKey'), 401);
    await next();
  }
}

router.get('/:providerId', checkApiAccessKey(), get);
router.post('/:providerId', checkApiAccessKey(), notify);

module.exports = router;