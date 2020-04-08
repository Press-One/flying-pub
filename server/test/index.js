'use strict';

// file: name of single test file
// grep: only run tests matching
// example: yarn test -- --file=api_task --grep='should return 200 with filter'

const app = require('../app');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const Mocha = require('mocha');
const argv = require('yargs').argv;
const mocha = new Mocha({
  grep: argv.grep || '',
  timeout: 60000,
  useColors: true,
});
const http = require('http');
const casePath = path.join(__dirname, '/cases/');

const server = http.createServer(app.callback());
server.listen(config.testPort);

mocha.addFile(`${__dirname}/before.js`);

fs.readdirSync(casePath).forEach((file) => {
  if (file.endsWith('.js') && file.includes(argv.file || '')) {
    let path = `${casePath}${file}`;
    mocha.addFile(path);
  }
});

// Run the tests.
mocha.run(() => {
  server.close();
  process.exit();
});