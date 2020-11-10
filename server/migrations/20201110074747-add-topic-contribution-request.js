module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('topic_contribution_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      postRId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      topicUserId: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      topicUuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
      },
      note: {
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
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('topic_contribution_requests');
  }
};