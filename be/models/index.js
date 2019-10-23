'use strict';

const fs = require('fs');
const path = require('path');
const basename = path.basename(module.filename);

fs.readdirSync(__dirname).filter(function (file) {
  return (file.indexOf('.') !== 0) && (file !== basename);
}).forEach(function (file) {
  module.exports[file.replace(/^(.*)\.js$/, '$1')] = require(
    path.join(__dirname, file)
  );
});