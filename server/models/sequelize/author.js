const Sequelize = require('sequelize');
const sequelize = require('./database');
const User = require('./user');

const Author = sequelize.define('authors', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  address: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false
  },
  nickname: {
    type: Sequelize.STRING
  },
  avatar: {
    type: Sequelize.STRING
  },
  cover: {
    type: Sequelize.TEXT,
  },
  bio: {
    type: Sequelize.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  charset: 'utf8mb4',
  indexes: [{
    fields: ['status']
  }]
});


const Subscription = sequelize.define('subscriptions', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
  },
  authorAddress: {
    type: Sequelize.STRING,
  },
}, {
  timestamps: true,
  charset: 'utf8mb4',
  indexes: [{
    fields: ['userId']
  }, {
    fields: ['authorAddress']
  }]
});

User.belongsToMany(Author, { as: 'followingAuthors', through: Subscription, sourceKey: 'id', targetKey: 'address', otherKey: 'authorAddress' })
Author.belongsToMany(User, { as: 'followers', through: Subscription, sourceKey: 'address', targetKey: 'id', otherKey: 'userId' })

module.exports = Author;