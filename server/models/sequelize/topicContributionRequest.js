const Sequelize = require('sequelize');
const sequelize = require('./database');
const Post = require('./post');
const Topic = require('./topic');

const TopicContributionRequest = sequelize.define('topic_contribution_requests', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  postRId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  topicUserId: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  topicUuid: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'pending'
  },
  note: {
    type: Sequelize.STRING,
  },
}, {
  timestamps: true,
  charset: 'utf8mb4',
});

TopicContributionRequest.belongsTo(Post, {
  foreignKey: 'postRId',
  targetKey: 'rId'
});

TopicContributionRequest.belongsTo(Topic, {
  foreignKey: 'topicUuid',
  targetKey: 'uuid'
});

module.exports = TopicContributionRequest;