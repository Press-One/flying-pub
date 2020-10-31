'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('authors', 'name', 'nickname');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('authors', 'nickname', 'name');
  }
};
