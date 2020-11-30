module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('comments', 'sticky', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('comments', 'sticky');
  }
};