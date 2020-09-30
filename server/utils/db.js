const config = require('../config');
const Sequelize = require('sequelize');

exports.init = (dbConfig, options = {}) => {
  const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: config.sequelizeLogging
  });

  (async () => {
    try {
      await sequelize.authenticate();
      console.log(`${options.name ? options.name + ' database' : 'Database'} connected successfully.`);
    } catch (err) {
      console.error('Unable to connect to the database:', err);
      process.exit(0);
    }
  })();

  return sequelize;
};