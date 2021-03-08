const Permission = require('./sequelize/permission');
const {
  assert,
  Errors
} = require('../utils/validator');
const User = require('../models/user');

const packPermission = async permission => {
  assert(permission, Errors.ERR_NOT_FOUND('permission'));
  const user = await User.getByAddress(permission.userAddress);
  assert(user, Errors.ERR_NOT_FOUND('user'));
  return permission;
}

/**
 * @param {object} option
 * @param {string} option.topic
 * @param {number} option.offset
 * @param {number} option.limit
 * @param {'allow' | 'deny'} option.type
 */
exports.getPermissionList = async (option) => {
  const {
    topic,
    type,
    offset,
    limit
  } = option
  assert(topic, Errors.ERR_IS_REQUIRED('topic'));
  assert(type, Errors.ERR_IS_REQUIRED('type'));

  let {
    count,
    rows
  } = await Permission.findAndCountAll({
    where: {
      topic,
      permission: type,
    },
    offset,
    limit,
  });

  rows = await Promise.all(
    rows.map(packPermission)
  )

  return {
    count,
    rows
  }
};

/**
 * @param {object} option
 * @param {number} option.userAddress
 * @param {string} option.topic
 * @param {'allow' | 'deny'} option.type
 */
exports.setPermission = async (option) => {
  const {
    userAddress,
    topic,
    type
  } = option;
  assert(userAddress, Errors.ERR_IS_REQUIRED('userAddress'));
  assert(topic, Errors.ERR_IS_REQUIRED('topic'));
  assert(type, Errors.ERR_IS_REQUIRED('type'));

  const [permissionItem] = await Permission.findOrCreate({
    where: {
      userAddress,
      topic,
    },
    defaults: {
      userAddress,
      topic,
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