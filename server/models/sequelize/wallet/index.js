const Sequelize = require('sequelize');
const sequelize = require('../database/wallet');

const Wallet = sequelize.define('wallets', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
    unique: true
  },
  customPin: {
    type: Sequelize.STRING,
    allowNull: true
  },
  mixinClientId: {
    type: Sequelize.STRING
  },
  mixinAesKey: {
    type: Sequelize.STRING
  },
  mixinPin: {
    type: Sequelize.STRING
  },
  mixinSessionId: {
    type: Sequelize.STRING
  },
  mixinPrivateKey: {
    type: Sequelize.TEXT
  },
  mixinAccount: {
    type: Sequelize.TEXT
  },
  version: {
    type: Sequelize.STRING(1),
  },
}, {
  timestamps: true,
  charset: 'utf8mb4',
  indexes: [{
    unique: true,
    fields: ['userId']
  }]
});

Wallet.sync();

module.exports = Wallet;