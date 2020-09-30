module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('files', 'invisibility', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    await queryInterface.addIndex('files', ['invisibility']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('files', ['invisibility']);
    await queryInterface.removeColumn('files', 'invisibility');
  }
};