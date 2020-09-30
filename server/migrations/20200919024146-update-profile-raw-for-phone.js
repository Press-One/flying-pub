'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('profiles', ['provider', 'providerId'], {
      unique: true,
      name: 'uq_idx_profiles_provider_providerid',
    });
    const profiles = await queryInterface.sequelize.query(
      `select id, name from profiles where provider = 'phone'`,
      {type: Sequelize.QueryTypes.SELECT}
    );
    if (profiles.length === 0) {
      return null;
    }

    const update_profiles = [];
    for (const p of profiles) {
      const raw = JSON.stringify({name: p.name});
      let now = new Date();
      now = now.toISOString();
      await queryInterface.sequelize.query(
        `update profiles set raw = '${raw}', "updatedAt" = '${now}' where id = ${p.id}`
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('profiles', 'uq_idx_profiles_provider_providerid');
    // can not downgrade profiles.raw modification 😂
  }
};
