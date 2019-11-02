const router = require('koa-router')();
const {
  get
} = require('../controllers/apiAtom');

router.get('/', get);

module.exports = router;