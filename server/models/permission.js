const Permission = require('./sequelize/permission');
const {
  assert,
  Errors
} = require('../utils/validator');
const User = require('../models/user');
const SSO_User = require('../models_SSO/user');

const packPermission = async permission => {
  assert(permission, Errors.ERR_NOT_FOUND('permission'));
  const pubUserId = await SSO_User.tryGetReaderIdByUserId(permission.userId);
  if (pubUserId) {
    permission.userId = pubUserId;
  } else {
    const user = await User.get(permission.userId);
    assert(user, Errors.ERR_NOT_FOUND('user'));
    assert(user.version === 1, Errors.ERR_IS_INVALID(`user.version do not match permission user id, ${permission.rId}`));
  }
  return permission;
}

/**
 * @param {object} option
 * @param {string} option.topicAddress
 * @param {number} option.offset
 * @param {number} option.limit
 * @param {'allow' | 'deny'} option.type
 */
exports.getPermissionList = async (option) => {
  const {
    topicAddress,
    type,
    offset,
    limit
  } = option
  assert(topicAddress, Errors.ERR_IS_REQUIRED('topicAddress'));
  assert(type, Errors.ERR_IS_REQUIRED('type'));

  let {
    count,
    rows
  } = await Permission.findAndCountAll({
    where: {
      topicAddress,
      permission: type,
    },
    offset,
    limit,
  });

  rows = await Promise.all(
    rows.map((row) => {
      return packPermission(row);
    })
  )

  return {
    count,
    rows
  }
};

/**
 * @param {object} option
 * @param {number} option.userId
 * @param {string} option.topicAddress
 * @param {'allow' | 'deny'} option.type
 */
exports.setPermission = async (option) => {
  const {
    topicAddress,
    type
  } = option
  let {
    userId
  } = option;
  userId = await SSO_User.tryGetUserIdByReaderUserId(userId);
  assert(userId, Errors.ERR_IS_REQUIRED('userId'));
  assert(topicAddress, Errors.ERR_IS_REQUIRED('topicAddress'));
  assert(type, Errors.ERR_IS_REQUIRED('type'));

  const [permissionItem] = await Permission.findOrCreate({
    where: {
      userId,
      topicAddress,
    },
    defaults: {
      userId,
      topicAddress,
      permission: type,
    },
  });

  if (permissionItem.permission === type) {
    return {
      updated: false
    }
  }

  await Permission.update({
    permission: type
  }, {
    where: {
      id: permissionItem.id
    },
  }, )

  return {
    updated: true
  }
};