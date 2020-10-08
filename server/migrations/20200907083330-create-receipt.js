module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('receipts', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      uuid: {
        type: Sequelize.STRING
      },
      fromAddress: {
        type: Sequelize.STRING
      },
      toAddress: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
      },
      currency: {
        type: Sequelize.STRING
      },
      amount: {
        type: Sequelize.DECIMAL(24, 16)
      },
      status: {
        type: Sequelize.STRING
      },
      provider: {
        type: Sequelize.STRING
      },
      snapshotId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      toSnapshotId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      raw: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      toRaw: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      memo: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fromProviderUserId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      toProviderUserId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      objectRId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      objectType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      viewToken: {
        type: Sequelize.TEXT,
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
        unique: true,
        fields: ['uuid']
      }, {
        fields: ['fromAddress']
      }, {
        fields: ['toAddress']
      }, {
        fields: ['type']
      }, {
        fields: ['currency']
      }, {
        fields: ['status']
      }, {
        fields: ['objectRId']
      }, {
        fields: ['objectType']
      }]
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('receipts');
  }
};