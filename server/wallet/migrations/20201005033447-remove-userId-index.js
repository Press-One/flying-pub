'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeConstraint('wallets', 'wallets_userId_key');
    } catch (err) {}
    try {
      await queryInterface.removeIndex('wallets', 'wallets_user_id');
    } catch (err) {}
  },

  down: async (queryInterface, Sequelize) => {

  }
};