const Sequelize = require('sequelize');
const sequelize = require('./database');

const Profile = sequelize.define('profiles', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
    unique: true
  },
  provider: {
    type: Sequelize.STRING
  },
  providerId: {
    type: Sequelize.BIGINT
  },
  name: {
    type: Sequelize.STRING
  },
  avatar: {
    type: Sequelize.TEXT,
  },
  bio: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  raw: {
    type: Sequelize.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  charset: 'utf8mb4',
  indexes: [{
    unique: true,
    fields: ['userId']
  }, {
    fields: ['provider']
  }, {
    fields: ['providerId']
  }]
});

module.exports = Profile;