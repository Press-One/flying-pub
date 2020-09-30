const Sequelize = require('sequelize');
const sequelize = require('./database');

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
  charset: 'utf8mb4',
  indexes: [{
    fields: ['userId']
  }, {
    fields: ['objectType']
  }, {
    fields: ['objectId']
  }, {
    fields: ['type']
  }]
});

module.exports = Vote;