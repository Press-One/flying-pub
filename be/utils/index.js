const config = require('../config');

exports.crypto = require('./crypto');

exports.log = message => {
  if (config.debug) {
    console.log(message);
  }
}