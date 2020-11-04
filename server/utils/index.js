const config = require('../config');

exports.crypto = require('./crypto');

exports.mimeTypes = require('./mimeTypes');

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

exports.immediatePromise = () =>
  new Promise((resolve) => {
    resolve();
  });

exports.truncate = (text, max = 8) => {
  const truncatedText = text.slice(0, max);
  const postfix = text.length > truncatedText.length ? '...' : '';
  return `${truncatedText}${postfix}`;
}

exports.removeEmpty = (obj) => {
  for (const key of Object.keys(obj)) {
    if (!obj[key] && obj[key] !== false) {
      delete obj[key];
    }
  }
  return obj
}

exports.listToJSON = list => list.map(item => item.toJSON())

exports.getHost = () => `${config.settings['site.url'] || config.serviceRoot}`;