const Sequelize = require('sequelize');
const sequelize = require('./');

const User = sequelize.define('users', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  providerId: {
    type: Sequelize.BIGINT,
  },
  provider: {
    type: Sequelize.STRING,
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

User.sync();

module.exports = User;