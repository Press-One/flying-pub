var router = require('koa-router')();
const {
  get,
} = require('../controllers/apiAuthor');

router.get('/:id', get);

module.exports = router;