const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')();
const convert = require('koa-convert');
const json = require('koa-json');
const bodyparser = require('koa-bodyparser')();
const logger = require('koa-logger');
const cors = require('@koa/cors');
const config = require('./config');
const session = require('koa-session');
const fs = require('fs');

const index = require('./routes/index');
const user = require('./routes/user');
const auth = require('./routes/auth');
const atom = require('./routes/atom');
const finance = require('./routes/finance');
const comment = require('./routes/comment');
const vote = require('./routes/vote');
const logout = require('./routes/logout');
const ping = require('./routes/ping');

const models = require('./models');

const {
  ensureAuthorization,
} = require('./models/api');

const redis = models.cache.init();

// middlewares
app.use(convert(bodyparser));
app.use(convert(json()));
app.use(cors({
  credentials: true
}));
app.use(convert(logger()));

app.keys = config.sessionKeys;
app.use(session(config.session, app));
const passport = models.auth.buildPassport();
app.use(passport.initialize());
app.use(passport.session());

router.all('*', models.api.errorHandler);
router.all('*', models.api.extendCtx);

router.use('/', index.routes(), index.allowedMethods());
router.use('/api/user', ensureAuthorization(), user.routes(), user.allowedMethods());
router.use('/api/auth', auth.routes(), auth.allowedMethods());
router.use('/api/atom', atom.routes(), atom.allowedMethods());
router.use('/api/finance', finance.routes(), finance.allowedMethods());
router.use('/api/comments', comment.routes(), comment.allowedMethods());
router.use('/api/votes', ensureAuthorization(), vote.routes(), vote.allowedMethods());
router.use('/api/logout', ensureAuthorization({
  strict: false
}), logout.routes(), logout.allowedMethods());
router.use('/api/ping', ping.routes(), ping.allowedMethods());

router.get('/api/session.json', async ctx => {
  const session = fs.readFileSync('session.json', 'utf8')
  ctx.ok(session);
});

app.use(router.routes(), router.allowedMethods());

app.on('error', function (err) {
  console.log(err)
});

app.serverUpCallback = (server) => {
  models.socketIo.init(redis, server);
}

module.exports = app;