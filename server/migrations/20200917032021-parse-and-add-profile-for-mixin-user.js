'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const profiles = await queryInterface.sequelize.query(
      `select "userId", raw from profiles where provider = 'mixin'`,
      {type: Sequelize.QueryTypes.SELECT}
    );

    if (profiles.length === 0) {
      return null;
    }
    const insert_profiles = [];
    for (const p of profiles) {
      if (! (p && p.userId && p.raw)) {
        continue;
      }
      const raw = JSON.parse(p.raw);

      if (!raw.phone) {
        continue;
      }

      const providerId = parseInt(raw.phone);
      if (providerId === 0) {
        continue;
      }
      const userId = p.userId;
      const provider = 'phone';
      const name = providerId.toString();
      // FIXME: hardcode
      const avatar = 'https://static.press.one/pub/avatar.png';

      const profile = await queryInterface.sequelize.query(
        `select id from profiles where provider = '${provider}' and "providerId" = ${providerId}`,
        {type: Sequelize.QueryTypes.SELECT}
      );
      if (profile.length > 0) {
        continue;
      }
      const now = new Date();
      insert_profiles.push({
        userId,
        provider,
        providerId,
        name,
        avatar,
        createdAt: now,
        updatedAt: now,
      });
    }
    // console.log(insert_profiles);
    if (insert_profiles.length > 0) {
      await queryInterface.bulkInsert('profiles', insert_profiles);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // can not downgrade 😂
  }
};
