'use strict';

const sequelize = require('../../models/sequelize/database');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await sequelize.authenticate();
      console.log(`已成功连接数据库，准备迁移缺失的用户 pub -> reader`);

      const pubProfiles = await queryInterface.sequelize.query(
        `select * from profiles where provider = 'mixin'`, {
          type: Sequelize.QueryTypes.SELECT
        }
      );
      if (pubProfiles.length === 0) {
        console.log('没有需要迁移的用户');
        return null;
      }
      const readerDbQueryInterface = sequelize.getQueryInterface();
      for (const pubProfile of pubProfiles) {
        const readerProfiles = await readerDbQueryInterface.sequelize.query(
          `select * from profiles where provider = 'mixin' and "providerId" = ${pubProfile.providerId}`, {
            type: Sequelize.QueryTypes.SELECT
          }
        );
        if (readerProfiles.length === 0) {
          console.log(`开始迁移 provider:${pubProfile.provider} providerId:${pubProfile.providerId} name:${pubProfile.name}`);
          const pubUsers = await queryInterface.sequelize.query(
            `select * from users where id = ${pubProfile.userId}`, {
              type: Sequelize.QueryTypes.SELECT
            }
          );
          const pubUser = pubUsers[0];
          const now = new Date();
          const insertUsers = [{
            nickname: pubProfile.name,
            bio: pubProfile.bio,
            avatar: pubProfile.avatar,
            mixinAccountRaw: '',
            aesEncryptedHexOfPrivateKey: '',
            publicKey: '',
            address: pubUser.address,
            createdAt: now,
            updatedAt: now,
          }];
          console.log(`address: ${pubUser.address}`)
          await readerDbQueryInterface.bulkInsert('users', insertUsers);
          const insertedUsers = await readerDbQueryInterface.sequelize.query(
            `select * from users where address = '${pubUser.address}'`, {
              type: Sequelize.QueryTypes.SELECT
            }
          );
          const insertedUser = insertedUsers[0];
          const insertProfiles = [{
            userId: insertedUser.id,
            provider: pubProfile.provider,
            providerId: pubProfile.providerId,
            name: pubProfile.name,
            avatar: pubProfile.avatar,
            bio: pubProfile.bio,
            raw: pubProfile.raw,
            createdAt: now,
            updatedAt: now
          }];
          await readerDbQueryInterface.bulkInsert('profiles', insertProfiles);
          console.log('完成');
        }
      }
      console.log(`迁移完成`);
    } catch (err) {
      console.error('Unable to connect to the database:', err);
      process.exit(0);
    }
  },

  down: async (queryInterface, Sequelize) => {

  }
};