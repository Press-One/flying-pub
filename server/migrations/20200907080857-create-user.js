module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      providerId: {
        type: Sequelize.BIGINT,
      },
      provider: {
        type: Sequelize.STRING,
      },
      address: {
        type: Sequelize.STRING,
        unique: true
      },
      aesEncryptedHexOfPrivateKey: {
        type: Sequelize.TEXT
      },
      publicKey: {
        type: Sequelize.TEXT
      },
      mixinAccountRaw: {
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
      },
    }, {
      timestamps: true,
      charset: 'utf8mb4',
      indexes: [{
        fields: ['providerId']
      }, {
        fields: ['provider']
      }, {
        unique: true,
        fields: ['address']
      }]
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};