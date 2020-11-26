const Sequelize = require('sequelize');
const sequelize = require('./database');

const UserExtra = sequelize.define('users_extra', {
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
  freezeTableName: true
});

module.exports = UserExtra;
