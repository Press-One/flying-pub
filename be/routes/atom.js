const router = require('koa-router')();
const {
  get
} = require('../controllers/atom');

router.get('/', get);

module.exports = router;