const config = require('../config.pub.wallet');

const dbConfig = {
  username: config.db.user,
  password: config.db.password,
  database: config.db.database,
  host: config.db.host,
  dialect: config.db.dialect,
};

module.exports = {
  development: dbConfig,
  production: dbConfig,
};