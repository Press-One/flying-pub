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
  deleted: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  charset: 'utf8',
  collate: 'utf8_general_ci'
});

Comment.sync();

module.exports = Comment;