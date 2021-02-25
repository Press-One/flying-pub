'use strict';

const passport = require('koa-passport');
const MixinStrategy = require('passport-mixin').Strategy;
const config = require('../config');

const buildPassport = () => {

  passport.use(new MixinStrategy({
    clientID: config.provider.mixin.clientId,
    clientSecret: config.provider.mixin.clientSecret,
    callbackURL: config.provider.mixin.callbackUrl,
    authorizationURL: config.provider.mixin.authorizationURL || ''
  }, (accessToken, refreshToken, profile, callback) => {
    profile.auth = {
      accessToken: accessToken,
      refreshToken: refreshToken
    };
    callback(null, profile);
  }));

  passport.serializeUser((user, callback) => {
    callback(null, user);
  });

  passport.deserializeUser((obj, callback) => {
    callback(null, obj);
  });

  return passport;
};

const authenticate = {
  mixin: passport.authenticate('mixin', {
    failureRedirect: config.provider.mixin.loginUrl,
    scope: 'PROFILE:READ'
  }),

  pressone: ctx => {
    ctx.redirect(`https://press.one/developer/apps/${config.provider.pressone.appAddress}/authorize?scope=user`);
  }
};

module.exports = {
  authenticate,
  buildPassport
};