module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('posts', 'status', {
      type: Sequelize.STRING,
    });
    await queryInterface.addIndex('posts', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('posts', ['status']);
    await queryInterface.removeColumn('posts', 'status');
  }
};