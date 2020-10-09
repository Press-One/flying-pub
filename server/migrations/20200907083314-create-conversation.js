module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.BIGINT,
        unique: true
      },
      conversationId: {
        type: Sequelize.STRING,
      },
      mixinAccountId: {
        type: Sequelize.STRING,
        unique: true
      },
      raw: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('conversations');
  }
};