const Sequelize = require('sequelize');
const sequelize = require('./');

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
  }
}, {
  timestamps: true,
  charset: 'utf8',
  collate: 'utf8_general_ci'
});

Wallet.sync();

module.exports = Wallet;