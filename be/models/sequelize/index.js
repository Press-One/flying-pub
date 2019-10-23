const config = require('../../config');
const Sequelize = require('sequelize');
const db = config.db;

module.exports = new Sequelize(db.database, db.user, db.password, {
  host: db.host,
  dialect: db.dialect
});