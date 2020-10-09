const Sequelize = require('sequelize');
const sequelize = require('./database');

const Settings = sequelize.define('settings', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
  },
  data: {
    type: Sequelize.TEXT
  },
}, {
  timestamps: true,
  charset: 'utf8mb4',
  indexes: [{
    unique: true,
    fields: ['userId']
  }]
});

module.exports = Settings;