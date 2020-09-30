module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('posts', 'invisibility', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    await queryInterface.addIndex('posts', ['invisibility']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('posts', ['invisibility']);
    await queryInterface.removeColumn('posts', 'invisibility');
  }
};