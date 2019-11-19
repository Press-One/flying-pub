const FastScanner = require('fastscan');
const words = require('./words');

exports.check = (content) => {
  const scanner = new FastScanner(words)
  const result = scanner.search(content, {
    quick: true
  });
  return result.length > 0;
}