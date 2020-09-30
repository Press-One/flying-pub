const Sequelize = require('sequelize');
const sequelize = require('./database/pub');

const File = sequelize.define('files', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
  },
  rId: {
    type: Sequelize.STRING,
    unique: true
  },
  title: {
    type: Sequelize.STRING
  },
  content: {
    type: Sequelize.TEXT
  },
  encryptedContent: {
    type: Sequelize.TEXT
  },
  msghash: {
    type: Sequelize.STRING,
    unique: true
  },
  mimeType: {
    type: Sequelize.STRING
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true
  },
  topicAddress: {
    type: Sequelize.STRING,
  },
  deleted: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
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
    fields: ['userId']
  }, {
    fields: ['deleted']
  }, {
    fields: ['visibility']
  }]
});

module.exports = File;