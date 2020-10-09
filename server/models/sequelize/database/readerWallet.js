const config = require('../../../config.wallet');
const {
  init
} = require('../../../utils/db');

module.exports = init(config.db, {
  name: 'Wallet'
});