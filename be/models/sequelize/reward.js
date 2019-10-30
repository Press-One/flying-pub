const Sequelize = require('sequelize');
const sequelize = require('./');

const Reward = sequelize.define('rewards', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  fileRId: {
    type: Sequelize.STRING,
  },
  summary: {
    type: Sequelize.STRING
  },
}, {
  timestamps: true,
  charset: 'utf8',
  collate: 'utf8_general_ci'
});

Reward.sync();

module.exports = Reward;