'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('comments', 'replyPreviewContent');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('comments', 'replyPreviewContent', {
      type: Sequelize.STRING
    });
  }
};
