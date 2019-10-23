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

  // Token
  ERR_AUTH_TOKEN_EXPIRED: 'Token expired',

  // File
  ERR_FILE_NOT_PUBLISHED: 'This file can not be updated because it\'s not published',
};

const codes = Object.keys(errors);
for (const code of codes) {
  if (typeof errors[code] !== 'function') {
    errors[`${code}_MSG`] = errors[code];
    errors[code] = code;
  }
}

module.exports = errors;