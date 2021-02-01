const config = require('../../../config');
const {
  init
} = require('../../../utils/db');

module.exports = init(config.db, {
  name: 'Main'
});