// 按照业务分类添加例如前缀 ERR_PROJECT_, ERR_TASK_；
// 尽可能只添加用户可能会碰到的错误，其余使用通用错误；
// 分 “抛出给用户的错误” 和 “不抛出给用户的内部错误” 两种，请仔细考虑；

const errors = {
  // ------------------ 会抛出给用户的错误 (400)

  // 通用错误
  ERR_FIELDS_INVALID: 'Fields is invalid', // 由 Validator.attempt 自动抛出
  ERR_IS_REQUIRED(field) {
    return {
      code: 'ERR_IS_REQUIRED',
      message: `${field} is required`
    };
  },
  ERR_IS_INVALID(field) {
    return {
      code: 'ERR_IS_INVALID',
      message: `${field} is invalid`
    };
  },
  ERR_NOT_FOUND(field) {
    return {
      code: 'ERR_NOT_FOUND',
      message: `${field} not found`
    };
  },
  ERR_IS_DUPLICATED(field) {
    return {
      code: 'ERR_IS_DUPLICATED',
      message: `${field} is duplicated`
    };
  },

  // 常用错误
  ERR_NO_PERMISSION: 'No permission',
  ERR_TOO_MANY_REQUEST: 'Too many request',

  // auth
  ERR_FAIL_TO_LOGIN: 'Fail to login',

  // Token
  ERR_AUTH_TOKEN_EXPIRED: 'Token expired',

  // Post
  ERR_POST_HAS_BEEN_DELETED: 'Post has been deleted',

  // 钱包
  ERR_WALLET_TRANSFER_VIA_MIXIN: 'Error transferring via Mixin wallet',
  ERR_WALLET_FAIL_TO_CREATE_WALLET: 'Error creating Mixin wallet.',
  ERR_WALLET_WRONG_PIN: 'Error creating new pin for Mixin wallet.',
  ERR_WALLET_FAIL_TO_UPDATE_PIN: 'Error updating pin for Mixin wallet.',
  ERR_WALLET_FAIL_TO_UPDATE_AVATAR: 'Error updating avatar for Mixin wallet.',
  ERR_WALLET_FAIL_TO_ACCESS_MIXIN_WALLET: 'Error accessing Mixin wallet.',
  ERR_WALLET_STATUS: 'Error wallet status.',
  ERR_WALLET_FETCH_BALANCE: 'Error fetching balance of user.',
  ERR_WALLET_TO_USER_WALLET_NOT_EXISTS: 'Error wallet status of to-user.',
  ERR_WALLET_WITHDRAW_REQUEST: 'Error withdraw request.',
  ERR_WALLET_FAIL_TO_CREATE_WITHDRAW_RECEIPT: 'Error creating withdraw receipt.',
  ERR_WALLET_FAIL_TO_CREATE_REWARD_RECEIPT: 'Error creating reward receipt.',
  ERR_WALLET_MISMATCH_PIN: 'Error mismatching pin.',
  ERR_WALLET_GT_MAX_AMOUNT: 'Error greater than max amount.',

  // 评论敏感词检测
  COMMENT_IS_INVALID() {
    return {
      code: 'ERR_IS_INVALID',
      message: `comment is invalid. reason: comment contains sensitive words.`
    };
  },
};

const codes = Object.keys(errors);
for (const code of codes) {
  if (typeof errors[code] !== 'function') {
    errors[`${code}_MSG`] = errors[code];
    errors[code] = code;
  }
}

module.exports = errors;