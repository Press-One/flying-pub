'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('files', 'topicAddress', 'topic');
    await queryInterface.renameColumn('permissions', 'topicAddress', 'topic');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('files', 'topic', 'topicAddress');
    await queryInterface.renameColumn('permissions', 'topic', 'topicAddress');
  }
};
