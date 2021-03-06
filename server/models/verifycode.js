const request = require('request-promise');
const config = require('../config');
const {
  assert,
  throws,
  Errors
} = require('../utils/validator');
const {generateSignature} = require('./signature');
const Log = require('./log');

const checkPhoneNumber = (phone) => {
  assert(phone, Errors.ERR_IS_REQUIRED('phone'))
  assert(/^(\+?86)?1\d{10}$/.exec(phone), Errors.ERR_IS_INVALID('phone'))
};

// send sms verification code
exports.sendSmsCode = async (phone) => {
  checkPhoneNumber(phone);

  const payload = {
    mobile: phone,
    action: 'login',
    expire_seconds: 30 * 60,
  };
  payload['signature'] = generateSignature(payload);
  await request({
    method: 'post',
    uri: config.messageSystem.sendSmsCodeURL,
    json: true,
    body: payload,
  }).promise();

  Log.createAnonymity('验证码', '发送成功');
}

// check sms verification code
exports.verifySmsCode = async (phone, code) => {
  checkPhoneNumber(phone);
  assert(code, Errors.ERR_IS_REQUIRED('code'))

  const payload = {
    mobile: phone,
    code: code,
    action: 'login',
  };

  payload['signature'] = generateSignature(payload, config.messageSystem.secretKey);
  try {
    await request({
      method: 'post',
      uri: config.messageSystem.verifySmsCodeURL,
      json: true,
      body: payload,
    }).promise();
    Log.createAnonymity('验证码', '验证通过');
  } catch (err) {
    throws(Errors.ERR_IS_INVALID('code'));
    Log.createAnonymity('验证码', '验证失败');
  }

}
