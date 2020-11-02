'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('comments', 'replyId', {
      type: Sequelize.BIGINT,
    });
    await queryInterface.addColumn('comments', 'replyPreviewContent', {
      type: Sequelize.STRING
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('comments', 'replyId');
    await queryInterface.removeColumn('comments', 'replyPreviewContent');
  }
};
