const Sequelize = require('sequelize');
const sequelize = require('./database');
const Author = require('./author');

const Post = sequelize.define('posts', {
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
  cover: {
    type: Sequelize.TEXT,
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
  },
  latestRId: {
    type: Sequelize.STRING
  },
  deleted: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  sticky: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: Sequelize.STRING
  },
  invisibility: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  charset: 'utf8mb4',
  indexes: [{
    unique: true,
    fields: ['rId']
  }, {
    fields: ['latestRId']
  }, {
    fields: ['deleted']
  }, {
    fields: ['sticky']
  }, {
    fields: ['status']
  }]
});

Post.belongsTo(Author, {
  foreignKey: 'userAddress',
  targetKey: 'address'
});
Author.hasMany(Post, {
  sourceKey: 'address',
  foreignKey: 'userAddress'
});

module.exports = Post;