'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const replyComments = await queryInterface.sequelize.query(
      `select id, "replyId" from comments where "threadId" is null and "replyId" is not null and version = 0 and deleted = false`, {
        type: Sequelize.QueryTypes.SELECT
      }
    );
    if (replyComments.length === 0) {
      return null;
    }
    console.log(`开始迁移${replyComments.length}条子评论`);
    for (const replyComment of replyComments) {
      let threadId = null;
      const threadComments = await queryInterface.sequelize.query(
        `select id, "threadId" from comments where id = ${replyComment.replyId} and deleted = false`, {
          type: Sequelize.QueryTypes.SELECT
        }
      );
      const threadComment = threadComments[0];
      if (!threadComment) {
        console.log(`回复的评论 ${replyComment.replyId} 已经被删除了`);
        continue;
      }
      if (threadComment.threadId) {
        threadId = threadComment.threadId;
      } else {
        threadId = threadComment.id;
      }
      await queryInterface.sequelize.query(
        `update comments set "threadId" = ${threadId} where id = ${replyComment.id}`, {
          type: Sequelize.QueryTypes.SELECT
        }
      );
      await queryInterface.sequelize.query(
        `update comments set "threadId" = ${threadId} where "threadId" = ${replyComment.id}`, {
          type: Sequelize.QueryTypes.SELECT
        }
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
