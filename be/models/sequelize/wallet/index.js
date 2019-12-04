const config = require('../../../config.wallet');
const Sequelize = require('sequelize');
const db = config.db;

const sequelize = new Sequelize(db.database, db.user, db.password, {
  host: db.host,
  dialect: db.dialect
});

const Wallet = sequelize.define('wallets', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT
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
    type: Sequelize.TINYINT(1),
  },
}, {
  timestamps: true,
  charset: 'utf8mb4'
});

Wallet.sync();

module.exports = Wallet;