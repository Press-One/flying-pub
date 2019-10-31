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
  charset: 'utf8',
  collate: 'utf8_general_ci'
});

Post.sync();

module.exports = Post;