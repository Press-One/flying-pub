const config = require('../../../config');
const Sequelize = require('sequelize');
const db = config.pub.db;

const sequelize = new Sequelize(db.database, db.user, db.password, {
  host: db.host,
  dialect: db.dialect
});

const Block = sequelize.define('blocks', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    unique: true
  },
  user_address: {
    type: Sequelize.STRING,
    allowNull: false
  },
  type: {
    type: Sequelize.STRING,
    allowNull: false
  },
  meta: {
    type: Sequelize.TEXT('medium'),
    allowNull: false
  },
  data: {
    type: Sequelize.TEXT('medium'),
    allowNull: false
  },
  hash: {
    type: Sequelize.STRING,
    allowNull: false
  },
  signature: {
    type: Sequelize.STRING,
    allowNull: false
  },
  blockNum: {
    type: Sequelize.BIGINT,
    unique: true,
    allowNull: true
  },
  blockTransactionId: {
    type: Sequelize.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  charset: 'utf8',
  collate: 'utf8_general_ci'
});

Block.sync();

module.exports = Block;