const Sequelize = require('sequelize');
const sequelize = require('./');

const Log = sequelize.define('logs', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
  },
  message: {
    type: Sequelize.TEXT
  },
}, {
  timestamps: true,
  charset: 'utf8mb4',
  indexes: [{
    fields: ['userId']
  }]
});

Log.sync();

module.exports = Log;