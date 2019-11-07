const Sequelize = require('sequelize');
const sequelize = require('./');

const Receipt = sequelize.define('receipts', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  uuid: {
    type: Sequelize.STRING
  },
  fromAddress: {
    type: Sequelize.STRING
  },
  toAddress: {
    type: Sequelize.STRING
  },
  type: {
    type: Sequelize.STRING
  },
  currency: {
    type: Sequelize.STRING
  },
  amount: {
    type: Sequelize.DECIMAL(65, 16)
  },
  status: {
    type: Sequelize.STRING
  },
  provider: {
    type: Sequelize.STRING
  },
  snapshotId: {
    type: Sequelize.STRING,
    allowNull: true
  },
  toSnapshotId: {
    type: Sequelize.STRING,
    allowNull: true
  },
  raw: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  toRaw: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  memo: {
    type: Sequelize.STRING,
    allowNull: true
  },
  fromProviderUserId: {
    type: Sequelize.STRING,
    allowNull: true
  },
  toProviderUserId: {
    type: Sequelize.STRING,
    allowNull: true
  },
  objectRId: {
    type: Sequelize.STRING,
    allowNull: true
  },
  objectType: {
    type: Sequelize.STRING,
    allowNull: true
  },
  viewToken: {
    type: Sequelize.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  charset: 'utf8',
  collate: 'utf8_general_ci'
});

Receipt.sync();

module.exports = Receipt;