const Log = require('../models/log');
const {
  assert,
  Errors,
} = require('../utils/validator');
const User = require('../models/user');
const Permission = require('../models/permission');
const Chain = require('./chain');
const config = require('../config');
const UserModel = require('../models/sequelize/user');
const PermissionModel = require('../models/sequelize/permission');

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
    const user = await User.get(permissionItem.userId)
    return {
      id: user.id,
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
  const userId = ctx.params.userid
  assert(userId, Errors.ERR_IS_REQUIRED('userid'))

  const user = await User.get(userId)
  assert(user, Errors.ERR_IS_REQUIRED('userId'));

  const {
    updated
  } = await Permission.setPermission({
    userId,
    topicAddress: config.topic.address,
    type,
  })

  ctx.body = {
    success: true,
  };

  if (updated) {
    const block = await Chain.pushTopic({
      userAddress: user.address,
      topicAddress: config.topic.address,
      type,
    })
    Log.create(userId, `提交 ${type} 区块, blockId ${block.id}`);
  }
}

exports.getAllowPermissionList = ctx => getPermissionList(ctx, 'allow')
exports.getDenyPermissionList = ctx => getPermissionList(ctx, 'deny')
exports.allow = ctx => changePermission(ctx, 'allow')
exports.deny = ctx => changePermission(ctx, 'deny')

exports.updatescript = async (ctx) => {
  try {
    const userlist = await UserModel.findAll()
    await Promise.all(userlist.map(async (userItem) => {
      await PermissionModel.findOrCreate({
        where: {
          topicAddress: config.topic.address,
          userId: userItem.id,
        },
        defaults: {
          userId: userItem.id,
          topicAddress: config.topic.address,
          permission: 'allow',
        },
      })
    }))
  } catch (e) {
    ctx.body = e.stack
    return
  }
  ctx.body = 'success'
}