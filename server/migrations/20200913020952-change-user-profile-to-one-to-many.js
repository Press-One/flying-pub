'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    Promise.all([
      queryInterface.addColumn(
        'users',
        'nickname',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
      ),
      queryInterface.addColumn(
        'users',
        'avatar',
        {
          type: Sequelize.TEXT,
        },
      ),
      queryInterface.addColumn(
        'users',
        'bio',
        {
          type: Sequelize.TEXT,
          allowNull: true,
        },
      ),
      queryInterface.addColumn(
        'profiles',
        'password',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
      ),
      queryInterface.removeConstraint('profiles', 'profiles_userId_key'),
      queryInterface.removeIndex('profiles', 'profiles_user_id'),
      queryInterface.addIndex('profiles', ['userId']),
    ]);
    // this change can not undo
    Promise.all([
      queryInterface.sequelize.query(`update users set nickname = profiles.name from profiles where users.nickname is null and users.id = profiles."userId"`),
      queryInterface.sequelize.query(`update users set bio = profiles.bio from profiles where users.bio is null and users.id = profiles."userId"`),
      queryInterface.sequelize.query(`update users set avatar = profiles.avatar from profiles where users.avatar is null and users.id = profiles."userId"`),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('users', 'nickname'),
      queryInterface.removeColumn('users', 'avatar'),
      queryInterface.removeColumn('users', 'bio'),
      queryInterface.removeColumn('profiles', 'password'),
    ]);
  }
};
