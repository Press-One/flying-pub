const Log = require('../models/log');
const {
  assert,
  Errors,
} = require('../utils/validator');
const User = require('../models/user');
const Permission = require('../models/permission');
const Chain = require('./chain');
const config = require('../config');

/**
 * @param {'allow' | 'deny'} type
 */
const getPermissionList = async (ctx, type) => {
  let {
    offset = 0, limit = 10
  } = ctx.query

  offset = Number(offset)
  limit = Number(limit)

  assert(
    !Number.isNaN(offset) && offset >= 0,
    Errors.ERR_IS_INVALID('offset'),
  )
  assert(
    !Number.isNaN(limit) && limit >= 1 && limit <= 100,
    Errors.ERR_IS_INVALID('limit'),
  )

  const {
    count,
    rows
  } = await Permission.getPermissionList({
    topicAddress: config.topic.address,
    type,
    offset,
    limit,
  })

  const list = await Promise.all(rows.map(async (permissionItem) => {
    const user = await User.getByAddress(permissionItem.userAddress)
    return {
      address: user.address,
      nickname: user.nickname,
      avatar: user.avatar,
    }
  }))

  ctx.body = {
    count,
    users: list,
  }
}

/**
 * @param {'allow' | 'deny'} type
 */
const changePermission = async (ctx, type) => {
  const userAddress = ctx.params.userAddress;
  assert(userAddress, Errors.ERR_IS_REQUIRED('userAddress'))

  const user = await User.getByAddress(userAddress)
  assert(user, Errors.ERR_IS_REQUIRED('userAddress'));

  const {
    updated
  } = await Permission.setPermission({
    userAddress: user.address,
    topicAddress: config.topic.address,
    type,
  });

  if (updated) {
    const block = await Chain.pushTopic({
      userAddress: user.address,
      topicAddress: config.topic.address,
      type,
    });
    Log.create(user.id, `提交 ${type} 区块, blockId ${block.id}`);
  }

  ctx.body = {
    success: true,
  };
}

exports.getAllowPermissionList = ctx => getPermissionList(ctx, 'allow')
exports.getDenyPermissionList = ctx => getPermissionList(ctx, 'deny')
exports.allow = ctx => changePermission(ctx, 'allow')
exports.deny = ctx => changePermission(ctx, 'deny')