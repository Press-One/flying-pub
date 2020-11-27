'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    queryInterface.renameTable('users_extra', 'users_extras');
  },

  down: async (queryInterface, Sequelize) => {
    queryInterface.renameTable('users_extras', 'users_extra');
  }
};
