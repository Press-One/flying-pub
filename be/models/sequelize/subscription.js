const Sequelize = require('sequelize');
const sequelize = require('./');
const Author = require('./author');

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

Subscription.sync();

Subscription.belongsTo(Author, {
  foreignKey: 'authorAddress',
  targetKey: 'address'
});

module.exports = Subscription;