const Sequelize = require('sequelize');
const sequelize = require('./');

const Subscription = sequelize.define('subscriptions', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
  },
  author: {
    type: Sequelize.STRING,
  },
}, {
  timestamps: true,
  charset: 'utf8mb4'
});

Subscription.sync();

module.exports = Subscription;