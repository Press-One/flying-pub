const Sequelize = require('sequelize');
const sequelize = require('./database');

const Comment = sequelize.define('comments', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
  },
  content: {
    type: Sequelize.TEXT
  },
  objectId: {
    type: Sequelize.STRING
  },
  objectType: {
    type: Sequelize.STRING
  },
  replyId: {
    type: Sequelize.BIGINT,
  },
  threadId: {
    type: Sequelize.BIGINT,
  },
  upVotesCount: {
    type: Sequelize.BIGINT,
    defaultValue: 0
  },
  deleted: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  sticky: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  version: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  charset: 'utf8mb4',
  indexes: [{
    fields: ['userId']
  }, {
    fields: ['objectId']
  }, {
    fields: ['deleted']
  }]
});

module.exports = Comment;