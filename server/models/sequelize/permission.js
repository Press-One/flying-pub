const Sequelize = require('sequelize');
const sequelize = require('./database');

const Permission = sequelize.define('permissions', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  userAddress: {
    type: Sequelize.STRING
  },
  // 即将废弃 userId
  userId: {
    type: Sequelize.BIGINT,
  },
  topic: {
    type: Sequelize.STRING,
  },
  permission: {
    type: Sequelize.STRING,
  },
}, {
  timestamps: true,
  charset: 'utf8mb4',
  indexes: [{
    fields: ['userId']
  }, {
    fields: ['topic']
  }, {
    fields: ['permission']
  }]
});

module.exports = Permission;