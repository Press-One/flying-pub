const Sequelize = require('sequelize');
const sequelize = require('./');

const PostsExtra = sequelize.define('posts', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  fileRId: {
    type: Sequelize.STRING,
  },
  rewardSummary: {
    type: Sequelize.STRING,
    defaultValue: ''
  },
  upVotesCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  commentsCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  charset: 'utf8mb4'
});

PostsExtra.sync();

module.exports = PostsExtra;