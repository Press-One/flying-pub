var router = require('koa-router')();
const {
  getBlock
} = require('../controllers/apiBlock');

router.get('/:id', getBlock);

module.exports = router;
