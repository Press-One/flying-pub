const Sequelize = require('sequelize');
const sequelize = require('./database');
const Author = require('./author');
const User = require('./user');

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
  viewCount: {
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

const PostUserFavorites = sequelize.define('posts_users_favorites', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  postRId: {
    type: Sequelize.STRING,
  },
  userId: {
    type: Sequelize.BIGINT,
  },
}, {
  timestamps: true,
  charset: 'utf8mb4'
});

Post.belongsTo(Author, {
  foreignKey: 'userAddress',
  targetKey: 'address'
});

Author.hasMany(Post, {
  sourceKey: 'address',
  foreignKey: 'userAddress'
});

Post.belongsToMany(User, { as: 'favoriteUsers', through: PostUserFavorites, sourceKey: 'rId', targetKey: 'id' });
User.belongsToMany(Post, { as: 'favoritePosts', through: PostUserFavorites, sourceKey: 'id', targetKey: 'rId' });

module.exports = Post;