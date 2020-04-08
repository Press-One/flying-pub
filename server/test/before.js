const {
  user
} = require('./fixtures');
const Token = require('../models/token');

before(async () => {
  global.token = await Token.create({
    userId: user.userId,
    providerId: user.providerId
  });
});