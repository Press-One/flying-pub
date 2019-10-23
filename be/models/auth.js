'use strict';

const passport = require('koa-passport');
const GithubStrategy = require('passport-github2').Strategy;
const MixinStrategy = require('passport-mixin').Strategy;
const config = require('../config');

const buildPassport = () => {
  passport.use(new GithubStrategy({
    clientID: config.github.clientID,
    clientSecret: config.github.clientSecret,
    callbackURL: config.github.callbackUrl
  }, (accessToken, refreshToken, profile, callback) => {
    profile.auth = {
      accessToken: accessToken,
      refreshToken: refreshToken
    };
    callback(null, profile);
  }));

  passport.use(new MixinStrategy({
    clientID: config.mixin.clientId,
    clientSecret: config.mixin.clientSecret,
    callbackURL: config.mixin.callbackUrl
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
  github: passport.authenticate('github', {
    failureRedirect: config.github.loginUrl,
    scope: ['read:user']
  }),

  mixin: passport.authenticate('mixin', {
    failureRedirect: config.mixin.loginUrl,
    scope: 'PROFILE:READ'
  }),

  pressone: ctx => {
    ctx.redirect(`https://press.one/developer/apps/${config.pressone.appAddress}/authorize?scope=user`);
  }
};

module.exports = {
  authenticate,
  buildPassport
};