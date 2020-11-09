module.exports = {
  up: async (queryInterface, Sequelize) => {
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
      blockNum: {
        type: Sequelize.BIGINT,
        unique: true,
        allowNull: true
      },
      blockTransactionId: {
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
        fields: ['blockNum']
      }, {
        fields: ['blockTransactionId']
      }]
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('blocks');
  }
};