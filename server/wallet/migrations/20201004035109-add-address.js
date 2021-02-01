'use strict';

const sequelize = require('../../models/sequelize/database');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'wallets',
      'userAddress', {
        type: Sequelize.STRING,
        unique: true
      },
    );

    try {
      await sequelize.authenticate();

      const readerDbQueryInterface = sequelize.getQueryInterface();
      const users = await readerDbQueryInterface.sequelize.query(
        `select id, address from users`, {
          type: Sequelize.QueryTypes.SELECT
        }
      );
      if (users.length === 0) {
        return null;
      }
      console.log(`开始迁移${users.length}个用户`);
      for (const user of users) {
        const now = new Date().toISOString();
        await queryInterface.sequelize.query(
          `update wallets set "userAddress" = '${user.address}', "updatedAt" = '${now}' where "userId" = ${user.id}`
        );
      }
      console.log(`迁移完成`);
    } catch (err) {
      console.error('Unable to connect to the database:', err);
      process.exit(0);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('wallets', 'userAddress');
  }
};