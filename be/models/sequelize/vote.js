const Sequelize = require('sequelize');
const sequelize = require('./');

const Vote = sequelize.define('votes', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
  },
  objectType: {
    type: Sequelize.STRING
  },
  objectId: {
    type: Sequelize.STRING
  },
  type: {
    type: Sequelize.STRING
  }
}, {
  timestamps: true,
  charset: 'utf8mb4'
});

Vote.sync();

module.exports = Vote;