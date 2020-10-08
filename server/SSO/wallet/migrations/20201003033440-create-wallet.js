module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('wallets', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.BIGINT,
        unique: true
      },
      customPin: {
        type: Sequelize.STRING,
        allowNull: true
      },
      mixinClientId: {
        type: Sequelize.STRING
      },
      mixinAesKey: {
        type: Sequelize.STRING
      },
      mixinPin: {
        type: Sequelize.STRING
      },
      mixinSessionId: {
        type: Sequelize.STRING
      },
      mixinPrivateKey: {
        type: Sequelize.TEXT
      },
      mixinAccount: {
        type: Sequelize.TEXT
      },
      version: {
        type: Sequelize.STRING(1),
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
      },
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
    await queryInterface.dropTable('wallets');
  }
};