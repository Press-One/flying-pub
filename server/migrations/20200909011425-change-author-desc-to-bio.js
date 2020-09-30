'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('authors', 'desc');
    await queryInterface.addColumn('authors', 'bio', {
        type: Sequelize.TEXT,
        allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('authors', 'bio');
    await queryInterface.addColumn('authors', 'desc', {
      type: Sequelize.STRING,
    });
  }
};
