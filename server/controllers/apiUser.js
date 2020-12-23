const Conversation = require('../models/conversation');
const {
  assert,
  throws,
  Errors
} = require('../utils/validator');
const User = require('../models/user');
const Profile = require('../models/profile');
const Wallet = require("../models/wallet");
const Author = require("../models/author");
const ReaderWallet = require("../models/readerWallet");
const {
  verifySmsCode
} = require('../models/verifycode');
const {
  removeEmpty,
  getHost
} = require('../utils');
const config = require('../config');
const Log = require('../models/log');
const Topic = require("../models/sequelize/topic");

exports.get = async ctx => {
  const {
    user
  } = ctx.verification;
  if (user.SSO) {
    user.SSO.reader.mixinWalletClientId = await ReaderWallet.getMixinClientIdByUserAddress(
      user.SSO.reader.address
    );
    user.SSO.pub.mixinWalletClientId = await Wallet.getMixinClientIdByUserAddress(
      user.SSO.pub.address
    );
  }
  const [mixinWalletClientId, mixinAccount, conversation, reviewEnabledTopic] = await Promise.all([
    Wallet.getMixinClientIdByUserAddress(
      user.address
    ),
    User.getMixinAccount(user.id),
    Conversation.get(user.id),
    Topic.findOne({
      attributes: ['id'],
      where: {
        userId: user.id,
        reviewEnabled: true
      }
    })
  ]);
  user.mixinWalletClientId = mixinWalletClientId;
  user.mixinAccount = mixinAccount;
  ctx.body = {
    ...user,
    notificationEnabled: !!conversation,
    topicReviewEnabled: !!reviewEnabledTopic,
  };
};

exports.getPublicUser = async ctx => {
  const userId = ctx.params.id;
  const user = await User.get(userId);
  assert(user, Errors.ERR_NOT_FOUND('user'));
  if (user.SSO) {
    user.SSO.reader.mixinWalletClientId = await ReaderWallet.getMixinClientIdByUserAddress(
      user.SSO.reader.address
    );
    user.SSO.pub.mixinWalletClientId = await Wallet.getMixinClientIdByUserAddress(
      user.SSO.pub.address
    );
  }
  ctx.body = user;
};

exports.put = async (ctx) => {
  const {
    nickname,
  } = ctx.request.body || {};
  const {
    user,
  } = ctx.verification;

  const data = removeEmpty(ctx.request.body);
  const support_fields = ['nickname', 'bio', 'avatar', 'cover', 'privateSubscriptionEnabled', 'privateContributionEnabled'];
  for (const [k, _] of Object.entries(data)) {
    if (!support_fields.includes(k)) {
      throws(Errors.ERR_IS_INVALID(k));
    }
  }

  if (Object.keys(data).length >= 0) {
    await User.update(user.id, data);
  }

  const updatedUser = await User.get(user.id);

  try {
    await Author.upsert(updatedUser.address, {
      nickname: updatedUser.nickname || '',
      avatar: updatedUser.avatar || '',
      cover: updatedUser.cover || '',
      bio: updatedUser.bio || '',
    });
  } catch (err) {
    console.log(err);
  }

  Log.createAnonymity('更新作者资料', `${nickname || updatedUser.nickname} ${getHost()}/authors/${updatedUser.address}`);

  ctx.body = updatedUser;
}


exports.setPassword = async (ctx) => {
  const {
    user
  } = ctx.verification;
  const userId = user.id;

  const {
    password,
    oldPassword,
    code,
  } = ctx.request.body || {};
  const provider = 'phone';

  assert(password, Errors.ERR_IS_REQUIRED('password'));
  assert(oldPassword || code, Errors.ERR_IS_REQUIRED('oldPassword or code'));

  const profile = await Profile.getByUserIdAndProvider(userId, provider);
  assert(profile, Errors.ERR_NOT_FOUND(`profile by userId = {userId}, provider = ${provider}`));
  const phone = profile.providerId;
  assert(phone, Errors.ERR_IS_INVALID('phone is empty'));

  if (oldPassword) {
    await Profile.updatePasswordWithOldPassword(userId, oldPassword, password, provider);
  } else if (code) {
    if (config.messageSystem.smsHardCode) {
      if (`${code}` !== config.messageSystem.smsHardCode) {
        await verifySmsCode(phone, code);
      }
    } else {
      await verifySmsCode(phone, code);
    }
    await Profile.setPassword(user.id, password, provider);
  }

  ctx.body = {
    success: true
  };
}

exports.addNewFeatRecord = async (ctx) => {
  const {
    sequelizeUser,
  } = ctx.verification;

  const {
    feat,
  } = ctx.request.body || {};
  assert(feat, Errors.ERR_IS_REQUIRED('feat'));

  const userExtra = await sequelizeUser.getUserExtra();

  if (!userExtra) {
    sequelizeUser.createUserExtra({newFeatRecord: JSON.stringify([feat])})
  } else {
    let newFeatRecord = userExtra.newFeatRecord ? JSON.parse(userExtra.newFeatRecord) : [];
    if (!newFeatRecord.includes(feat)) {
      newFeatRecord.push(feat);
      userExtra.newFeatRecord = JSON.stringify(newFeatRecord);
      await userExtra.save();
    }
  }

  ctx.body = {
    success: true
  };
}
