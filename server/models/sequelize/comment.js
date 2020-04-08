const Sequelize = require('sequelize');
const sequelize = require('./');

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
  upVotesCount: {
    type: Sequelize.BIGINT,
    defaultValue: 0
  },
  deleted: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
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

Comment.sync();

module.exports = Comment;