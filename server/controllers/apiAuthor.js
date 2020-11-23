const config = require("../config");
const Author = require('../models/author');
const User = require("../models/user");
const Cache = require("../models/cache");
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const _ = require('lodash');
const {
  assert,
  Errors
} = require('../utils/validator');

exports.get = async ctx => {
  const userId = ctx.verification && ctx.verification.user.id;
  const address = ctx.params.id;
  const withSummary = ctx.query.withSummary;
  const summaryPreviewCount = ctx.query.summaryPreviewCount || 0;
  const authorUserWithRaw = await User.getByAddress(address, {
    returnRaw: true
  });
  assert(authorUserWithRaw, Errors.ERR_NOT_FOUND('author'))
  const { user: authorUser, sequelizeUser } = authorUserWithRaw;
  let authorResult = await Author.getByAddress(address, {
    returnRaw: true
  });
  if (!authorResult) {
    try {
      await Author.upsert(address, {
        status: 'deny',
      });
      authorResult = await Author.getByAddress(address, {
        returnRaw: true
      });
    } catch (err) {
      console.log(err)
    }
  }
  const { author, sequelizeAuthor } = authorResult;
  assert(author, Errors.ERR_NOT_FOUND('author'))

  if (authorUser) {
    author.avatar = author.avatar || authorUser.avatar;
    author.nickname = author.nickname || authorUser.nickname;
    author.bio = author.bio || authorUser.bio;
    author.privateSubscriptionEnabled = authorUser.privateSubscriptionEnabled;
  }

  const [
    followingCount,
    followingPreview,
    followerCount,
    followerPreview,
    topicCount,
    topicPreview,
    followingTopicCount,
    followingTopicPreview,
    postCount
  ] = await Promise.all([
    sequelizeUser.countFollowingAuthors({
      where: {
        address: {
          [Op.not]: address
        }
      },
    }),
    sequelizeUser.getFollowingAuthors({
      where: {
        address: {
          [Op.not]: address
        }
      },
      limit: summaryPreviewCount,
      attributes: ['address', 'avatar'],
      joinTableAttributes: []
    }),
    sequelizeAuthor.countFollowers({
      where: {
        id: {
          [Op.not]: authorUser.id
        }
      }
    }),
    sequelizeAuthor.getFollowers({
      where: {
        id: {
          [Op.not]: authorUser.id
        }
      },
      limit: summaryPreviewCount,
      attributes: ['avatar'],
      joinTableAttributes: []
    }),
    sequelizeUser.countTopics({
      where: {
        deleted: false
      }
    }),
    sequelizeUser.getTopics({
      where: {
        deleted: false
      },
      limit: summaryPreviewCount,
      attributes: ['cover']
    }),
    sequelizeUser.countFollowingTopics({
      where: {
        deleted: false
      },
    }),
    sequelizeUser.getFollowingTopics({
      where: {
        deleted: false
      },
      limit: summaryPreviewCount,
      attributes: ['cover'],
      joinTableAttributes: []
    }),
    sequelizeAuthor.countPosts({
      where: {
        deleted: false,
        invisibility: false
      }
    })
  ]);

  if (withSummary) {
    const derivedFollowingPreview = await Author.packAuthors(followingPreview);
    author.summary = {
      followingAuthor: {
        count: followingCount,
        preview: derivedFollowingPreview.map(item => item.avatar)
      },
      follower: {
        count: followerCount,
        preview: followerPreview.map(item => item.avatar)
      },
      topic: {
        count: topicCount,
        preview: topicPreview.map(item => item.cover)
      },
      followingTopic: {
        count: followingTopicCount,
        preview: followingTopicPreview.map(item => item.cover)
      },
      post: {
        count: postCount
      }
    }
  }
  
  if (userId) {
    const count = await sequelizeAuthor.countFollowers({
      where: {
        id: userId
      }
    });
    author.following = count > 0;
  }

  ctx.body = author;
}

exports.listRecommended = async ctx => {
  const currentSequelizeUser = ctx.verification && ctx.verification.sequelizeUser;
  const TYPE = 'AUTHORS';
  const KEY = 'RECOMMENDED';
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const cachedAuthors = await Cache.pGet(TYPE, KEY);
  let authors = [];
  if (cachedAuthors) {
    authors = JSON.parse(cachedAuthors);
  } else {
    authors = await Author.listRecommended({
      limit: 150
    });
    const halfDay = 60 * 60 * 12;
    const cachedDuration = config.recommendation ? config.recommendation.authors.cachedDuration : halfDay;
    if (authors.length === 150) {
      await Cache.pSetWithExpired(TYPE, KEY, JSON.stringify(authors), cachedDuration, true);
    }
  }
  const shuffledAuthors = _.shuffle(authors).slice(0, limit);
  let derivedAuthors = shuffledAuthors;
  if (currentSequelizeUser) {
    derivedAuthors = await Promise.all(
      shuffledAuthors.map(async shuffledAuthor => {
        const count = await currentSequelizeUser.countFollowingAuthors({
          where: {
            address: shuffledAuthor.address
          }
        });
        shuffledAuthor.following = count > 0; 
        return shuffledAuthor;
      })
    );
  }
  ctx.body = {
    authors: derivedAuthors
  }
}