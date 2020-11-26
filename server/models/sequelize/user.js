const Sequelize = require('sequelize');
const sequelize = require('./database');
const UserExtra = require('./userExtra');

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
  cover: {
    type: Sequelize.TEXT,
  },
  bio: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  version: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  privateSubscriptionEnabled: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  charset: 'utf8mb4',
  indexes: [{
    unique: true,
    fields: ['address']
  }]
});

User.hasOne(UserExtra, {
  as: 'UserExtra',
  foreignKey: 'userId',
  sourceKey: 'id'
});

UserExtra.belongsTo(User,{
  foreignKey: 'userId',
  targetKey: 'id'
});

module.exports = User;
