const config = require('../../config');
const Sequelize = require('sequelize');
const db = config.db;

const sequelize = new Sequelize(db.database, db.user, db.password, {
  host: db.host,
  dialect: db.dialect,
  logging: config.sequelizeLogging
});

sequelize.sync().then(() => {
  console.log('Database connected successfully.');
}, err => {
  if (err.name === 'SequelizeConnectionError') {
    console.log('Database maybe not ready to be connected');
  }
  process.exit(0);
});

module.exports = sequelize;