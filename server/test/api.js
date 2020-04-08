const config = require('../config');

module.exports = require('supertest')(`http://${config.host}:${config.testPort}`);