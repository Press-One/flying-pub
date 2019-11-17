const FastScanner = require('fastscan');
const words = require('./words');

exports.check = (content) => {
  const scanner = new FastScanner(words)
  const hits = scanner.hits(content)
  return Object.keys(hits);
}