'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // files
    await queryInterface.addColumn(
      'files',
      'userAddress', {
        type: Sequelize.STRING
      },
    );
    await queryInterface.addIndex('files', ['userAddress']);
    await queryInterface.sequelize.query(`update files set "userAddress" = users.address from users where users.id = files."userId"`);

    // permissions
    await queryInterface.addColumn(
      'permissions',
      'userAddress', {
        type: Sequelize.STRING
      },
    );
    await queryInterface.addIndex('permissions', ['userAddress']);
    await queryInterface.sequelize.query(`update permissions set "userAddress" = users.address from users where users.id = permissions."userId"`);
  },

  down: async (queryInterface, Sequelize) => {
    // files
    await queryInterface.removeColumn('files', 'userAddress');
    await queryInterface.removeIndex('files', ['userAddress']);

    // permissions
    await queryInterface.removeColumn('permissions', 'userAddress');
    await queryInterface.removeIndex('permissions', ['userAddress']);
  }
};