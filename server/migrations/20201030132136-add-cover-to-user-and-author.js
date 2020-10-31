'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'cover', {
      type: Sequelize.TEXT,
    });
    await queryInterface.addColumn('authors', 'cover', {
      type: Sequelize.TEXT,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'cover');
    await queryInterface.removeColumn('authors', 'cover');
  }
};
