'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('blocks', 'legacy_blocks');

    await queryInterface.createTable('blocks', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        unique: true
      },
      user_address: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      meta: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      data: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      signature: {
        type: Sequelize.STRING,
        allowNull: false
      },
      blockNumber: {
        type: Sequelize.BIGINT,
        unique: true,
        allowNull: true
      },
      blockHash: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      }
    }, {
      timestamps: true,
      charset: 'utf8mb4',
      indexes: [{
        fields: ['user_address']
      }, {
        fields: ['type']
      }, {
        fields: ['blockNumber']
      }, {
        fields: ['blockHash']
      }]
    });

    const legacyBlocks = await queryInterface.sequelize.query(
      `select * from legacy_blocks`, {
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (!legacyBlocks || legacyBlocks.length === 0) {
      return null;
    }

    console.log({ 'legacyBlocks.length': legacyBlocks.length });

    const now = new Date();
    const blocks = legacyBlocks.map(legacyBlock => ({
      id: legacyBlock.id,
      type: legacyBlock.type,
      meta: legacyBlock.meta,
      data: legacyBlock.data,
      user_address: legacyBlock.user_address,
      hash: '',
      signature: '',
      createdAt: now,
      updatedAt: now,
    }));

    await queryInterface.bulkInsert('blocks', blocks);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('blocks');
    await queryInterface.renameTable('legacy_blocks', 'blocks');
  }
};
