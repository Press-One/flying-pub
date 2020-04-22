const Sequelize = require('sequelize');
const sequelize = require('./');

const Conversation = sequelize.define('conversations', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
    unique: true
  },
  conversationId: {
    type: Sequelize.STRING,
  },
  mixinAccountId: {
    type: Sequelize.STRING,
    unique: true
  },
  raw: {
    type: Sequelize.TEXT,
  }
}, {
  timestamps: true,
  charset: 'utf8mb4',
  indexes: [{
    unique: true,
    fields: ['userId']
  }]
});

Conversation.sync();

module.exports = Conversation;