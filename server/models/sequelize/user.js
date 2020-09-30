const Sequelize = require('sequelize');
const sequelize = require('./database');

const User = sequelize.define('users', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  address: {
    type: Sequelize.STRING,
    unique: true
  },
  aesEncryptedHexOfPrivateKey: {
    type: Sequelize.TEXT
  },
  publicKey: {
    type: Sequelize.TEXT
  },
  mixinAccountRaw: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  nickname: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  avatar: {
    type: Sequelize.TEXT,
  },
  bio: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  version: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  charset: 'utf8mb4',
  indexes: [{
    fields: ['providerId']
  }, {
    fields: ['provider']
  }, {
    unique: true,
    fields: ['address']
  }]
});

module.exports = User;