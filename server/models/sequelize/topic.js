const Sequelize = require('sequelize');
const sequelize = require('./database');
const User = require('./user');
const Post = require('./post');

const Topic = sequelize.define('topics', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
  },
  uuid: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    unique: true,
  },
  cover: {
    type: Sequelize.STRING,
    allowNull: false
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  contributionEnabled: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  reviewEnabled: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  deleted: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  charset: 'utf8mb4',
});

User.hasMany(Topic);

const UserTopic = sequelize.define('users_topics', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
  },
  topicUuid: {
    type: Sequelize.UUID,
  },
}, {
  timestamps: true,
  charset: 'utf8mb4'
});

const PostTopic = sequelize.define('posts_topics', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  postRId: {
    type: Sequelize.STRING,
  },
  topicUuid: {
    type: Sequelize.UUID,
  },
}, {
  timestamps: true,
  charset: 'utf8mb4'
});


User.belongsToMany(Topic, { as: 'followingTopics', through: UserTopic, sourceKey: 'id', targetKey: 'uuid' });
Topic.belongsToMany(User, { as: 'followers', through: UserTopic, sourceKey: 'uuid', targetKey: 'id' });
Post.belongsToMany(Topic, { as: 'topics', through: PostTopic, sourceKey: 'rId', targetKey: 'uuid' });
Topic.belongsToMany(Post, { as: 'posts', through: PostTopic, sourceKey: 'uuid', targetKey: 'rId' });

module.exports = Topic;