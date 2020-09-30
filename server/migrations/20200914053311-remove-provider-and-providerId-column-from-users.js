'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('users', 'provider'),
      queryInterface.removeColumn('users', 'providerId'),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'users',
        'provider',
        {
          type: Sequelize.STRING,
        },
      ),
      queryInterface.addColumn(
        'users',
        'providerId',
        {
          type: Sequelize.BIGINT,
        },
      ),
    ]);
  }
};
