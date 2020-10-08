module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('posts', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      rId: {
        type: Sequelize.STRING,
        unique: true
      },
      userAddress: {
        type: Sequelize.STRING,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      paymentUrl: {
        type: Sequelize.STRING
      },
      pubDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      rewardSummary: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      upVotesCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      commentsCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      latestRId: {
        type: Sequelize.STRING
      },
      deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      sticky: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
        fields: ['rId']
      }, {
        fields: ['latestRId']
      }, {
        fields: ['deleted']
      }, {
        fields: ['sticky']
      }]
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('posts');
  }
};