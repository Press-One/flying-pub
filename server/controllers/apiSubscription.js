const config = require("../config");
const User = require('../models/user');
const Author = require('../models/author');
const Log = require('../models/log');
const {
  assert,
  Errors
} = require("../utils/validator");
const { listToJSON, truncate } = require('../utils');
const _ = require('lodash');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const {
  pushToNotificationQueue,
} = require("../models/notification");
const {
  getAuthorNewFollowerPayload,
} = require("../models/messageSystem");

exports.subscribe = async ctx => {
  const { user, sequelizeUser } = ctx.verification;
  const authorAddress = ctx.params.authorAddress;
  const author = await Author.getByAddress(authorAddress, {
    raw: true
  });
  assert(author, Errors.ERR_NOT_FOUND('author'));
  await sequelizeUser.addFollowingAuthors(author);
  Log.create(user.id, `关注作者 ${authorAddress}`);
  (async () => {
    try {
      const authorUser = await User.getByAddress(author.address);
      const mixinRedirectUrl = `${config.settings['site.url'] || config.serviceRoot}/authors/${user.address}?action=OPEN_NOTIFICATION_MODAL&tab=3`;
      await pushToNotificationQueue({
        mixin: {
          userId: authorUser.id,
          text: `${truncate(user.nickname)} 关注了你`,
          url: mixinRedirectUrl
        },
        messageSystem: getAuthorNewFollowerPayload({
          fromUserName: user.address,
          fromNickName: user.nickname,
          fromUserAvatar: user.avatar,
          toUserName: author.address,
          toNickName: author.nickname,
        })
      })
    } catch (err) {
      console.log(err);
    }
  })();
  ctx.body = true;
}

exports.unsubscribe = async ctx => {
  const user = ctx.verification.sequelizeUser;
  const authorAddress = ctx.params.authorAddress;
  const author = await Author.getByAddress(authorAddress, {
    raw: true
  });
  assert(author, Errors.ERR_NOT_FOUND('author'));
  await user.removeFollowingAuthors(author);
  Log.create(user.id, `取关作者 ${authorAddress}`);
  ctx.body = true;
}

const appendFollowingStatus = async (authors, user) => {
  const authorAddresses = authors.map(author => author.address);
  const followingAuthors = await user.getFollowingAuthors({
    where: {
      address: {
        [Op.in]: authorAddresses
      }
    },
    attributes: ['address'],
    joinTableAttributes: []
  });
  const followingAuthorAddresses = followingAuthors.map(author => author.address);
  const derivedAuthors = authors.map(author => {
    author.following = followingAuthorAddresses.includes(author.address);
    return author;
  });
  return derivedAuthors;
}
exports.appendFollowingStatus = appendFollowingStatus;

exports.listFollowing = async ctx => {
  const user = ctx.verification && ctx.verification.sequelizeUser;
  const authorAddress = ctx.params.authorAddress;
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const { sequelizeUser: publicUser } = await User.getByAddress(authorAddress, {
    returnRaw: true
  });
  assert(publicUser, Errors.ERR_NOT_FOUND('user'));
  const [ total, authors ] = await Promise.all([
    publicUser.countFollowingAuthors({
      where: {
        address: {
          [Op.not]: authorAddress
        }
      },
    }),
    publicUser.getFollowingAuthors({
      where: {
        address: {
          [Op.not]: authorAddress
        }
      },
      attributes: ['address', 'nickname', 'avatar', 'cover', 'bio'],
      joinTableAttributes: [],
      offset,
      limit
    })
  ]);

  let derivedAuthors = await listToJSON(authors);

  derivedAuthors = await Author.packAuthors(derivedAuthors);

  if (user && derivedAuthors.length > 0) {
    derivedAuthors = await appendFollowingStatus(derivedAuthors, user);
  }

  ctx.body = {
    total,
    authors: derivedAuthors
  };
}

exports.listFollowers = async ctx => {
  const user = ctx.verification && ctx.verification.sequelizeUser;
  const authorAddress = ctx.params.authorAddress;
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const { author, sequelizeAuthor } = await Author.getByAddress(authorAddress, {
    returnRaw: true,
    withUserId: true
  });
  assert(author, Errors.ERR_NOT_FOUND('author'));
  const [ total, users ] = await Promise.all([
    sequelizeAuthor.countFollowers({
      where: {
        id: {
          [Op.not]: author.userId
        }
      }
    }),
    sequelizeAuthor.getFollowers({
      where: {
        id: {
          [Op.not]: author.userId
        }
      },
      joinTableAttributes: [],
      offset,
      limit
    })
  ]);

  let derivedAuthors = await Promise.all(users.map(async user => {
    const derivedUser = await User.packUser(user.toJSON());
    return _.pick(derivedUser, ['address', 'nickname', 'avatar', 'cover', 'bio'])
  }));

  if (user && derivedAuthors.length > 0) {
    derivedAuthors = await appendFollowingStatus(derivedAuthors, user);
  }

  ctx.body = {
    total,
    authors: derivedAuthors
  };
}