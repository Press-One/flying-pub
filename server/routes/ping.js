var router = require('koa-router')();
const {
  ping
} = require('../controllers/apiPing');

router.get('/', ping);

const {
  listNoPhoneProfile,
  addPhoneToProfile,
  addNoInGroupToProfile
} = require('../controllers/apiPing');
router.get('/listNoPhoneProfile', listNoPhoneProfile);
router.put('/addPhoneToProfile', addPhoneToProfile);
router.put('/addNoInGroupToProfile', addNoInGroupToProfile);

module.exports = router;