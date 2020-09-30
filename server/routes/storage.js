var router = require('koa-router')();
const {
  get
} = require('../controllers/apiStorage');

router.get('/:filename', get);

module.exports = router;