'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.removeColumn('users', 'provider'),
      queryInterface.removeColumn('users', 'providerId'),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn(
        'users',
        'provider', {
          type: Sequelize.STRING,
        },
      ),
      queryInterface.addColumn(
        'users',
        'providerId', {
          type: Sequelize.BIGINT,
        },
      ),
    ]);
  }
};