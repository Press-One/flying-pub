'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('posts', 'mimeType', {
      type: Sequelize.STRING
    });
    await queryInterface.sequelize.query(`update posts set "mimeType" = 'text/markdown'`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('posts', 'mimeType');
  }
};
