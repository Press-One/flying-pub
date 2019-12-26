const Sequelize = require('sequelize');
const sequelize = require('./');

const Author = sequelize.define('author', {
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
  }
}, {
  timestamps: true,
  charset: 'utf8mb4'
});

Author.sync();

module.exports = Author;