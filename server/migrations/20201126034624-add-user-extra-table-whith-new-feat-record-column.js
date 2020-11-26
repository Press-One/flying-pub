module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users_extra', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.BIGINT,
        references: {
          model: {
            tableName: 'users',
          },
          key: 'id',
        },
        unique: true,
        allowNull: false,
      },
      newFeatRecord: {
        type: Sequelize.TEXT,
        defaultValue: '[]',
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
        fields: ['userId']
      }]
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users_extra');
  }
};
