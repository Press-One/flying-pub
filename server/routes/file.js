var router = require('koa-router')();
const {
  list,
  create,
  remove,
  update,
  get,
  hide,
  show,
  getByRId
} = require('../controllers/apiFile');
const {
  ensureAuthorization
} = require('../middleware/api');

router.get('/', ensureAuthorization(), list);
router.post('/', ensureAuthorization(), create);
router.put('/hide/:id', ensureAuthorization(), hide);
router.put('/show/:id', ensureAuthorization(), show);
router.del('/:id', ensureAuthorization(), remove);
router.put('/:id', ensureAuthorization(), update);
router.get('/rid/:rId', ensureAuthorization(), getByRId);
router.get('/:id', ensureAuthorization(), get);

module.exports = router;