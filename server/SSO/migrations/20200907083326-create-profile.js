module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('profiles', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.BIGINT,
        unique: true
      },
      provider: {
        type: Sequelize.STRING
      },
      providerId: {
        type: Sequelize.BIGINT
      },
      name: {
        type: Sequelize.STRING
      },
      avatar: {
        type: Sequelize.TEXT,
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      raw: {
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
        fields: ['userId']
      }, {
        fields: ['provider']
      }, {
        fields: ['providerId']
      }]
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('profiles');
  }
};