module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('posts', 'sticky', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    } catch (e) {
      console.log(e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('posts', 'sticky');
  }
};