const Sequelize = require('sequelize');
const sequelize = require('./database');

const Author = sequelize.define('authors', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  address: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false
  },
  name: {
    type: Sequelize.STRING
  },
  avatar: {
    type: Sequelize.STRING
  },
  bio: {
    type: Sequelize.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  charset: 'utf8mb4',
  indexes: [{
    fields: ['status']
  }]
});

module.exports = Author;