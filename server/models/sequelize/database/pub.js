const SSOConfig = require('../../../SSO/config.pub');
const {
  init
} = require('../../../utils/db');

module.exports = init(SSOConfig.db, {
  name: 'Pub'
});