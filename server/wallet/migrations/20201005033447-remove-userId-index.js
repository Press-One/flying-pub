'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('wallets', 'wallets_userId_key');
    await queryInterface.removeIndex('wallets', 'wallets_user_id');
  },

  down: async (queryInterface, Sequelize) => {

  }
};