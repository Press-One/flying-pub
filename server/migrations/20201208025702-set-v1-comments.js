'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`update comments set version = 1 where comments."threadId" is not null`);
  },

  down: async (queryInterface, Sequelize) => {
   
  }
};
