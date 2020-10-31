const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')();
const convert = require('koa-convert');
const json = require('koa-json');
const bodyparser = require('koa-bodyparser')();
const logger = require('koa-logger');
const cors = require('@koa/cors');
const session = require('koa-session');
const serve = require('koa-static');
const views = require('koa-views');

const user = require('./routes/user');
const author = require('./routes/author');
const auth = require('./routes/auth');
const token = require("./routes/token");
const profile = require("./routes/profile");
const finance = require('./routes/finance');
const readerFinance = require('./routes/readerFinance');
const post = require('./routes/post');
const comment = require('./routes/comment');
const vote = require('./routes/vote');
const settings = require('./routes/settings');
const conversation = require('./routes/conversation');
const subscription = require('./routes/subscription');
const file = require('./routes/file');
const topic = require('./routes/topic');
const blockTopic = require('./routes/blockTopic');
const storage = require('./routes/storage');
const webhook = require('./routes/webhook');
const importRoute = require('./routes/import');
const upload = require('./routes/upload');
const block = require('./routes/block');
const logout = require('./routes/logout');
const autoLogin = require('./routes/autoLogin');
const ping = require('./routes/ping');

const config = require('./config');
const models = require('./models');
const prepare = require('./prepare');

const {
  ensureAuthorization,
  errorHandler,
  extendCtx
} = require('./middleware/api');

if (process.env.NODE_ENV === 'production') {
  prepare.initStatic();
}

const redis = models.cache.init();

// middlewares
app.use(convert(bodyparser));
app.use(convert(json()));
app.use(cors({
  credentials: true
}));
app.use(convert(logger()));

app.keys = config.encryption.sessionKeys;
app.use(session(config.session, app));
const passport = models.auth.buildPassport();
app.use(passport.initialize());
app.use(passport.session());
app.use(views(__dirname + '/build'));

const serveOptions = {};
if (!config.staticCDN) {
  serveOptions.maxage = 365 * 24 * 60 * 60;
}
app.use(serve('build', serveOptions));

router.all('*', errorHandler);
router.all('*', extendCtx);

router.use("/api/user", user.routes(), user.allowedMethods());
router.use("/api/token", token.routes(), token.allowedMethods());
router.use('/api/auth', auth.routes(), auth.allowedMethods());
router.use("/api/profile", profile.routes(), profile.allowedMethods());
router.use('/api/reader_finance', readerFinance.routes(), readerFinance.allowedMethods());
router.use('/api/finance', finance.routes(), finance.allowedMethods());
router.use('/api/posts', post.routes(), post.allowedMethods());
router.use('/api/authors', author.routes(), author.allowedMethods());
router.use('/api/comments', comment.routes(), comment.allowedMethods());
router.use('/api/votes', ensureAuthorization(), vote.routes(), vote.allowedMethods());
router.use('/api/settings', ensureAuthorization({
  strict: false
}), settings.routes(), settings.allowedMethods());
router.use('/api/conversations', conversation.routes(), conversation.allowedMethods());
router.use('/api/subscriptions', subscription.routes(), subscription.allowedMethods());
router.use('/api/files', file.routes(), file.allowedMethods());
router.use('/api/topics', topic.routes(), topic.allowedMethods());
router.use('/api/block_topics', blockTopic.routes(), blockTopic.allowedMethods());
router.use('/api/storage', storage.routes(), storage.allowedMethods());
router.use('/api/webhook', webhook.routes(), webhook.allowedMethods());
router.use('/api/import', importRoute.routes(), importRoute.allowedMethods());
router.use('/api/upload', ensureAuthorization(), upload.routes(), upload.allowedMethods());
router.use('/api/blocks', block.routes(), block.allowedMethods());
router.use('/api/logout', ensureAuthorization({
  strict: false
}), logout.routes(), logout.allowedMethods());
router.use('/api/auto_login', autoLogin.routes(), autoLogin.allowedMethods());
router.use('/api/ping', ping.routes(), ping.allowedMethods());

router.get('*', async ctx => ctx.render('index'));

app.use(router.routes(), router.allowedMethods());

app.on('error', function (err) {
  console.log(err)
});

app.serverUpCallback = (server) => {
  models.socketIo.init(redis, server);
}

module.exports = app;