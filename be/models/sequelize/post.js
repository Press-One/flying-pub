const Sequelize = require('sequelize');
const sequelize = require('./');

const Post = sequelize.define('posts', {
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
    type: Sequelize.BIGINT,
    defaultValue: 0
  },
  commentsCount: {
    type: Sequelize.BIGINT,
    defaultValue: 0
  }
}, {
  timestamps: true,
  charset: 'utf8mb4'
});

Post.sync();

module.exports = Post;