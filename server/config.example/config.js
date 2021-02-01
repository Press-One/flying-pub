const serviceRoot = 'http://localhost:9000';
const serviceName = 'FLYING_PUB_LOCAL';
const serviceKey = `${serviceName}_READER`;

module.exports = {
  // 是否在终端打印日志
  debug: false,

  // 是否在终端打印数据库日志
  sequelizeLogging: false,

  // 服务的访问地址
  serviceRoot: `${serviceRoot}`,

  // 服务的名称
  serviceKey: `${serviceKey}`,

  host: `localhost`,

  port: 9000,

  // 队列服务端口
  queuePort: 9001,

  // 测试服务端口
  testPort: 9002,

  // 站点 favicon
  favicon: `https://img-cdn.xue.cn/favicon.ico`,

  // 静态资源 CDN
  staticCDN: ``,

  // 数据库
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

  // 支持的登录方式
  provider: {
    mixin: {
      aesKey: `dpWgOfj+fF/EWdDyTjRFbAlupg2Tg9c3QzNKgrZdK+8=`,
      id: 7000102340,
      clientSecret: `e1e531350e33f21cc6e0813bbd10ebb0385f148b2dcebf082ba5f43c14af3443`,
      pinCode: `988795`,
      clientId: `44931a6d-2029-4c8d-888f-cbb3afe509bb`,
      sessionId: `6943eb4b-714e-4b41-b187-f73564c16e71`,
      pinToken: `ejUM3nBzx28yWhj6eJ9v36N7UOdSpLRi7qEFgzbTm2CDoVzMDFIBXDUSM68MRxCQa8LPWwv/Z3aNDJ0qA6x9tDldJqewus4J61u00EFOK7wmHh7V7dKegzepBNsEnJVG+bxZVDf3TRnrs76vqrMLe0kwdgSgu/THoYNzuLLyl3g=`,
      privateKey: `-----BEGIN RSA PRIVATE KEY-----\r\nMIICXQIBAAKBgQCet3iDdTqsY1R6ZR69CfvQzTJRWhk58OJ/2DnPek23IXZ5X4JW\r\nWFndsbYeFNaAIIpZ+z9XUS40b2NfsfpRi6B8KH83y+tWkRDE7p8gPScYEwAN+Er7\r\nT2CD2npjVz6MTSqciTpmHTdaTdmvqpx2svitV24F+KZ7mSeJwx7mvwCj2wIDAQAB\r\nAoGBAJKRqcf0NTfHDtdslGNMWfBr3iDETHF2YyReoJxaPHR2gXr6WVm1g1+4Yg8L\r\nfT6bTkhkPg07maiwiJtxt1Eg2RT5joWmleJ1xt4CHerlmPmHIr9VnoJsnehk3Yic\r\nhvcj+RSumT5wWqxBs2ichXJkxbmaRZ/6wRElgILl8eKISQ2ZAkEA200RJ3HYxnK7\r\nagcWZO+T4GYS2BJ454dFNGytMcRRi1vWuge2NdaP/zx+u6qscj3FryUfxLGZkpfB\r\nEwgMXnSlzwJBALlG8tvwgTKwdrSTCvezaSR8Kpe4qeIUZny14QvQ8/2QJmJol+El\r\nnGGOniEmPMXyfSob6JddNvgEL5VXDqZksDUCQEvcshVyFao4oEqCXyXVltMmnFgw\r\ns7BsI+2JtrQjlI3f3D0IU+j162RA+hpTZUozwkHfVskFIvoKExlRTG4UbhMCQQCS\r\n+1T45IAqTVGuiSRfQyY7OoGzoVysLNDtSICDFj4pvuykjyNGCsdXoYOS+rmls2xW\r\nNpO7WMid0vxItiq6GBCtAkBAffOSGcgicdg/Tf4WSM16HYMJdD+LFd92I6ZhFv8n\r\nSSPEot1uAD+WXtiaa4CM2/9Ku+jtPadSIcFli3fJTR8G\r\n-----END RSA PRIVATE KEY-----\r\n`,
      loginUrl: `/api/auth/mixin/login`,
      callbackUrl: `${serviceRoot}/api/auth/mixin/callback`,
      domain: 'https://mixin-www.zeromesh.net',
      authorizationURL: 'https://mixin-www.zeromesh.net/oauth/authorize'
    },

    pressone: {
      appAddress: "d6fe91f2711c805e7743304ac60fe18b35dc9fa1"
    }
  },

  // 要同步哪个 topic 下的用户和文章
  topic: {
    'privateKey': `4be6b27d306bfb56a99f9affbf889a4f29790f03bffcdad9e58b6e98cd4f3fc6`,
    'address': `0ea59a16e9df81b0780065e294235cf6327adb82`,
  },

  // 同步服务
  atom: {
    // 要同步哪个 topic 下的用户和文章
    topic: `0ea59a16e9df81b0780065e294235cf6327adb82`,
    // 同步服务提供的 API，返回该 topic 下的用户列表
    authorsUrl: `http://localhost:7070/users`,
    // 同步服务提供的 API，返回该 topic 下的文章列表
    postsUrl: `http://localhost:7070/json_posts`,
  },

  // 前后端共用的配置
  settings: {
    // 站点名称
    'site.name': `飞帖开发版`,
    // 站点标题（浏览器 tab 显示的文案）
    'site.title': `飞帖开发版`,
    // 一句话介绍本站点
    'site.slogan': `飞帖开发版`,
    // 站点 logo
    'site.logo': `https://img-cdn.xue.cn/17-flying-pub.png`,
    // 是否开启 Mixin 消息通知
    'notification.enabled': false,
    // Mixin id
    'notification.mixin.id': 7000102340,
    // 是否开放作者详情页（取决于你是否提供关注作者的功能）
    'author.page.enabled': true,
    // 是否提供关注作者的功能
    'subscriptions.enabled': true,
    // 是否开启文章筛选器
    'filter.enabled': true,
    // 筛选器默认类型
    'filter.type': `LATEST`,
    // 是否开启热门排序
    'filter.popularity.enabled': false,
    'filter.latest.enabled': true,
    // 热门排序时间段
    'filter.dayRangeOptions': [],
    // 支持的货币类型
    'wallet.currencies': ['CNB', 'PRS', 'BOX', 'BTC', 'EOS', 'ETH'],
    'site.url': `http://localhost:5000`,
    // 自定义菜单
    'menu.links': [],
    'mixinApp.name': '新生大讲堂',
    'mixinApp.downloadUrl': 'https://firesbox.com',
    'mixinApp.logo': 'https://static-assets.xue.cn/images/395b16fecce9f5bca118ee59c3b0ce82abcca800bcf8500eefa1750c3f11aff8',
    'mixinApp.onlyAllowedMobileDevice': true,
    'auth.providers': ['mixin'],
  },

  postView: {
    enabled: true,
    visible: true,
    ipExpiredDuration: 10 * 60, // 10 分钟
  },

  // 权限认证
  auth: {
    SSOTokenDomain: 'localhost',
    tokenKey: `FLYING_PUB_${serviceName}_TOKEN`,
    apiAccessKey: `1d612e68c74b7553d630267bbc7f7574`,
    // 如果站点是私密的，把用户的 providerId 放入白名单，则该用户不需要通过校验就能访问私密
    adminList: {
      phone: [],
      mixin: []
    },
    whitelist: {
      phone: [],
      mixin: []
    },
  },

  // 加密相关的 key
  encryption: {
    sessionKeys: ['e1b657856a2134217e5f2e4b15527a32'],
    jwtKey: `2492f6ba5ca50ced7d9580c56cd5a2fc64c9f4dcd91c2f11d15f80deeaf2dfa5`,
    // 加密文章的 key，访问加密过的文章，如果没有这对 key 解密，是看不到原文的
    aes256Cbc: {
      key: `99b32688c8bc95042e18991b47c18bde48d1c0f3ad3531efb9a79c2464124666`,
      ivPrefix: `dd4144175a607114419a86a136041c56f6cf8fd233cb1c38cd7b2fd18a8767b9`,
    },
    aesKey256: [16,29,21,9,21,16,26,27,28,27,7,21,0,16,6,10,3,4,20,9,14,15,26,11,17,7,20,30,14,2,31,2],
  },

  messageSystem: {
    enabled: false,
  },

  recommendation: {
    authors: {
      // 60 * 60 * 12 半天
      cachedDuration: 60
    }
  },

  assistantUserId: 1,

  search: {
    enabled: false
  },

  queueDisabledJobs: ['atom'],
};