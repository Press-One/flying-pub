const config = require('../config');
const router = require('koa-router')();
const {
  list,
  listBySubscriptions,
  get,
  update
} = require('../controllers/apiPost');
const {
  assert,
  Errors,
} = require('../models/validator');

const {
  ensureAuthorization
} = require('../middleware/api');

const isPrivate = config.settings['permission.isPrivate'];

const checkApiAccessKey = () => {
  return async (ctx, next) => {
    const apiAccessKey = config.auth.apiAccessKey;
    assert(apiAccessKey === ctx.headers['x-api-access-key'], Errors.ERR_IS_INVALID('apiAccessKey'), 401);
    await next();
  }
}

router.get('/', ensureAuthorization({
  strict: isPrivate,
  checkApiAccessKey: true
}), list);
router.get('/subscription', ensureAuthorization(), listBySubscriptions);
router.get('/:id', ensureAuthorization({
  strict: isPrivate,
  checkApiAccessKey: true
}), get);
router.put('/:id', checkApiAccessKey(), update);

module.exports = router;