const Sequelize = require('sequelize');
const sequelize = require('./database');

const UserExtra = sequelize.define('users_extras', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
    unique: true,
    allowNull: false
  },
  newFeatRecord: {
    type: Sequelize.TEXT,
    defaultValue: '[]',
  },
}, {
  timestamps: true,
  charset: 'utf8mb4',
  indexes: [{
    unique: true,
    fields: ['userId']
  }],
});

module.exports = UserExtra;
