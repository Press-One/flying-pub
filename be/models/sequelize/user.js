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
}, {
  timestamps: true,
  charset: 'utf8',
  collate: 'utf8_general_ci'
});

User.sync();

module.exports = User;