const config = require('../../../SSO/config.pub.wallet');
const {
  init
} = require('../../../utils/db');

module.exports = init(config.db, {
  name: 'Wallet'
});