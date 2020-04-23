const config = require('../config');

exports.crypto = require('./crypto');

exports.fm = require('./front-matter');

exports.log = message => {
  if (config.debug) {
    console.log(message);
  }
}

exports.sleep = (duration) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });