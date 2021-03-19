const serviceRoot = 'http://localhost:9000';
const serviceName = 'LOCAL_OS';
const serviceKey = `${serviceName}_FLYING_PUB`;

module.exports = {

  debug: false,

  sequelizeLogging: false,

  serviceRoot: `${serviceRoot}`,

  serviceKey: `${serviceKey}`,

  host: `localhost`,

  port: 9000,

  queuePort: 9001,

  testPort: 9002,

  favicon: `https://img-cdn.xue.cn/favicon.ico`,

  staticCDN: ``,

  db: {
    host: `localhost`,
    database: "flying_pub",
    user: "postgres",
    password: "39f12851f5275222e8b50fddddf04ee4",
    dialect: `postgres`,
  },

  redis: {
    host: `localhost`,
    port: 6379,
    password: `a863a35d270fceb110f96374d75c219f`,
    connectTimeout: 3000,
  },

  session: {
    key: `session`,
    maxAge: 86400000,
    overwrite: true,
    httpOnly: true,
    signed: true,
    rolling: false,
    renew: false,
  },

  provider: {
    mixin: {
      id: `7000102340`,
      pinCode: `093526`,
      clientId: `44931a6d-2029-4c8d-888f-cbb3afe509bb`,
      sessionId: `feb1e0a8-8ab2-4f51-8966-d0a76613af81`,
      clientSecret: `94a506c1f412bf0dd2a96bd6a9f981aa8385bf71206f4295d52eb5509ba0010c`,
      pinToken: `OppUDB9OQo4RyjhBAuRCmmTRUsNk3Y+yW1w6ve31uurpqeuSlFJk7+tj+p9gPj10O/PPljUZtDv0lSwQKj2EOZWgqBqwGIeqYmT55GA2vXGtjoYiZe5IT2AY7QcMhsferS8bvNI31nrocRlm8RdrECaATQr5+oruRPB1BPChs0s=`,
      privateKey: `-----BEGIN RSA PRIVATE KEY-----\r\nMIICXgIBAAKBgQDYsuddh4gXwBRY8QKFF0/miNIqS7OIep9irHFcXqCotV3BhLKn\r\nEe6M7azNXlzcKf9jjZW3YLt+HbUkp2ovJNvj7hGaolsvz732s4nd6Mj9iiMwpF1J\r\nK9pp67ANW438LyYqIXGIcAyhdnllsP4+z7PDP+oFO+g8F/c+AB2ab/8o1wIDAQAB\r\nAoGBAIEAD6eoFSY+XF6OKvfb5t7QOHyhUCFBDj0JdvqMAowsW8HmIww+KoqOur4P\r\nHKyb+8Lh+GyQE02CleFaIGYsRRGUgOh+bzH+8hd35vn30tHCnXPWRdDrKr0t7DR3\r\nE+ULWiMJaTcU6Ka0/mf/Gmx3uZh2NS/u5/rfK8DxIJ7Fy84hAkEA8+QsUakDZhXu\r\nId5RCQovfoXVHfErgR+xlup1yPH6+IY9wMaEqgvQFUqJ0y7WUHaFjVeWe7nrjQ31\r\nYxiwzvUTqQJBAON1Hja2qK2b+GNGkNu5cKmMR+hCn+ycj1rxpSWn4XWfcsc9VqXC\r\nsZwnGKu6adWrjk2nljZigho98UwGG4WYKH8CQQCKyIODsGZzt/T7JtP8DeS63ZNJ\r\nZ4w2/P8EfsSppTEILPOE+DJTxUcSZokJODTSMq+Kn5XNMB3e9Vt2mX07N3CJAkEA\r\nwoY3ALPWLiNlmgGPgVpmb5n5JTlVbBW4xB5FDp80wlNK5fofUEPhgZouDy+ts360\r\nhNT+MiSs/6RZ6JqQjwBCIQJAbyojMzkK8pbsTMmq8e0BynwVscLayrp0GDKGppig\r\nkeBVuSDKiuSvP7iN8m3OcGs9Gkt6yFWIFwA7fooyM6JVaw==\r\n-----END RSA PRIVATE KEY-----\r\n`,
      aesKey: `hGRhhGD3lKkzowugU1gaXgzi4bLcRY0VR1KBg8yGNG0=`,
      domain: `https://mixin-www.zeromesh.net`,
      authorizationURL: `https://mixin-www.zeromesh.net/oauth/authorize`,
      tokenURL: 'https://mixin-api.zeromesh.net/oauth/token',
      userProfileURL: 'https://mixin-api.zeromesh.net/me',
      apiDomain: 'https://mixin-api.zeromesh.net',
      wsDomain: 'wss://mixin-blaze.zeromesh.net/',
      callbackUrl: `${serviceRoot}/api/auth/mixin/callback`
    }
  },

  topic: {
    account: "prs.1gw.nw",
    publicKey: "EOS6RybF7Bb11xfMfhiy4sVJLuYW6Pe2bkVyctXfso2webXYmXAGe",
    privateKey: "5K9bPkXAgdegw6DYAZu6XEaN1okaFzhRhDVhab6v4RYES2B1XdA",
    blockProducerEndpoint: 'https://prs-bp-cn1.xue.cn',
  },

  settings: {
    'site.name': `飞帖开发版`,
    'site.title': `飞帖开发版`,
    'site.slogan': `飞帖开发版`,
    'site.logo': `https://img-cdn.xue.cn/17-flying-pub.png`,
    'notification.mixin.enabled': true,
    'author.page.enabled': true,
    'subscriptions.enabled': true,
    'filter.enabled': true,
    'filter.type': `LATEST`,
    'filter.popularity.enabled': false,
    'filter.latest.enabled': true,
    'filter.dayRangeOptions': [7, 30],
    'wallet.currencies': ['CNB', 'PRS', 'BOX', 'BTC', 'EOS', 'ETH'],
    'site.url': `http://localhost:5000`,
    'menu.links': [],
    'permission.isPrivate': false,
    'permission.isOnlyPubPrivate': false,
    'permission.denyText': `您需要加入【飞帖】才能阅读内容`,
    'permission.denyActionText': `如何加入？`,
    'permission.denyActionLink': `https://abc.com/如何加入？`,
    'auth.providers': ['mixin'],
    'mixinApp.name': '新生大讲堂',
    'mixinApp.downloadUrl': 'https://firesbox.com',
    'mixinApp.logo': 'https://static-assets.xue.cn/images/395b16fecce9f5bca118ee59c3b0ce82abcca800bcf8500eefa1750c3f11aff8'
  },

  postView: {
    enabled: true,
    visible: true,
    ipExpiredDuration: 10 * 60,
  },

  auth: {
    tokenDomain: 'localhost',
    tokenKey: `FLYING_PUB_${serviceName}_TOKEN`,
    adminList: {
      mixin: []
    },
    whitelist: {
      mixin: []
    },
  },

  encryption: {
    accountKeystorePassword: 'e1b657856a2134217e5f2e4b15527a32',
    sessionKeys: ['e1b657856a2134217e5f2e4b15527a32'],
    jwtKey: `2492f6ba5ca50ced7d9580c56cd5a2fc64c9f4dcd91c2f11d15f80deeaf2dfa5`,
    aes256Cbc: {
      key: `99b32688c8bc95042e18991b47c18bde48d1c0f3ad3531efb9a79c2464124666`,
      ivPrefix: `dd4144175a607114419a86a136041c56f6cf8fd233cb1c38cd7b2fd18a8767b9`,
    },
    aesKey256: [16,29,21,9,21,16,26,27,28,27,7,21,0,16,6,10,3,4,20,9,14,15,26,11,17,7,20,30,14,2,31,2],
  },

  recommendation: {
    authors: {
      cachedDuration: 60 * 60 * 12
    }
  },

};