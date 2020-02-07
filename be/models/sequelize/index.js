const config = require('../../config');
const Sequelize = require('sequelize');
const db = config.db;

const sequelize = new Sequelize(db.database, db.user, db.password, {
  host: db.host,
  dialect: db.dialect,
  logging: config.sequelizeLogging
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    process.exit(0);
  }
})();

module.exports = sequelize;