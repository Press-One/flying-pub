const Sequelize = require('sequelize');
const sequelize = require('./');
const Author = require('./author');

const Post = sequelize.define('post', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  rId: {
    type: Sequelize.STRING,
    unique: true
  },
  userAddress: {
    type: Sequelize.STRING,
    allowNull: false
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  paymentUrl: {
    type: Sequelize.STRING
  },
  pubDate: {
    type: Sequelize.DATE,
    allowNull: false
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

Post.sync();

Post.belongsTo(Author, {
  foreignKey: 'userAddress',
  targetKey: 'address'
});

module.exports = Post;