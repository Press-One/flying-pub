var router = require('koa-router')();
const {
  get
} = require('../controllers/apiUser');

router.get('/', get);

module.exports = router;