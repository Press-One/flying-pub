module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.BIGINT,
      },
      topicAddress: {
        type: Sequelize.STRING,
      },
      permission: {
        type: Sequelize.STRING,
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
        fields: ['userId']
      }, {
        fields: ['topicAddress']
      }, {
        fields: ['permission']
      }]
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('permissions');
  }
};