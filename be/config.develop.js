'use strict';

const serviceRoot = 'http://localhost:9000';
const serviceKey = 'LOCAL_XUE_POSTS';

const config = {
  debug: true,

  serviceKey,

  env: 'development',

  serviceRoot,

  host: '127.0.0.1',

  port: '9000',

  queuePort: 8071,

  testPort: 8092,

  db: {
    host: '127.0.0.1',
    database: 'posts',
    user: 'postgres',
    password: '8e01d6f60c7a846c38d5f99cf3f53383',
    dialect: 'postgres'
  },

  redis: {
    host: '127.0.0.1',
    port: 6379,
    connectTimeout: 1000 * 3
  },

  sessionKeys: ['0b06684a4a6274df375aa1e128c4ab69'],

  session: {
    key: `${serviceKey}:sess`,
    maxAge: 1000 * 60 * 60 * 24,
    overwrite: true,
    httpOnly: true,
    signed: true,
    rolling: false,
    renew: false
  },

  provider: {
    mixin: {
      sync: true,
      clientId: '44931a6d-2029-4c8d-888f-cbb3afe509bb',
      aesKey: 'OLK48kq9gqZfcSZZKscpBlt1f2NzF7foOpu4VizE94E=',
      clientSecret: '5c01a9d07ec45d6bff2a5360cb97a07a457a5f75d6fefc163e8d9f4d0451cdd6',
      pinCode: '851623',
      sessionId: 'd8af6036-1424-4cc2-8939-e8959e0675d0',
      pinToken: 'W7NAyQL7PR+tmpSnOOl/uz1Vi2YLh9SrNRRojloecBulFn6EAvlz0pkfZEmqjzLV+g+FYP31QdUW1of3wVELYsF6AMizWHteLU9ttI7aLTDlIclIxFgeTGydiz2HTxKA2IYykBInXdereqWBds7B1drpr4Uyu0/1XaafvAOo7+4=',
      privateKeyFilePath: './mixin.key',
      privateKey: `-----BEGIN RSA PRIVATE KEY-----\r\nMIICWwIBAAKBgQCLQQgvIzUKOYSShEFkHOuUo/uG7ocnOjTsvbyZlWdoZVkK6TZE\r\nEabLT7OpBoaTKiTQMa2C/LsC0h2lgruEreTMjyex2qB0ZHESlQ0PJliqJFUUo5U+\r\nBtbVzGj4A2sORWQ12yI339LJy8xcMspUzOvRWj/+lV0RCcAoDsbn5+fhUwIDAQAB\r\nAoGAGzd9qwDdl/7/60cQJMoGPUoDmi66ma8lsvOujfIGgP/19Ez6fzlX+Tq9qZaN\r\n7Ot6wHpFKGnO/1Ej3Dp9/gOiyRBdoG7g9YamX9c4ySdKYgxALvvtKrtqHvl+GVDy\r\nFevSe5u41IV+AhVcjaqzCwREWitNfGfgkLWlRcXYQ6aX2XECQQDwz68C8fpRy3yP\r\nnR/FxClchykKejlSr9k44n4sz8qeT15a9Q/7UGNKODxJAee5Jl3l/w7JkSuGbR5j\r\neplmN/3LAkEAlAmHwknrYYiJYNIJ4IoVZz9lVIz8LZcABYYPX01m1GvkWPmlrX9Z\r\n3h7tLw9cpICM+6pUFAvW/7y8Lme3rO05mQJAA+FU0JdVkTvWJfpCKM2gXP1Qi/qs\r\nMcjjlycPIWm3uhVNT+ni+Amzj96YGhUNxs33dV1Gv7i3GtNnSfMPxbXhQQJAQAm3\r\nXoaXegOUWfvCJg3VoGo+LUsns5kEe184uyNCflWF3C9yShEzEPET7S2aB9dMJXnT\r\nETDl+o7sYK6hN/8O0QJACXmEdbROaNVq1B/9MYPkeC/z9h9YVu8DvqUw5muMpOVd\r\nye6n7ljFQl3ql6yF0yk5n3idyGPZ5ySb1Lhz9yhkKw==\r\n-----END RSA PRIVATE KEY-----\r\n`,
      loginUrl: '/api/auth/mixin/login',
      callbackUrl: `${serviceRoot}/api/auth/mixin/callback`
    }
  },

  atom: {
    topic: 'a7b751cc0e2f6c5be01ce95bc80b02d071022af4',
    authorsUrl: `http://prs-bp1.press.one:7070/users`,
    postsUrl: `http://prs-bp1.press.one:7070/posts`
  },

  encryption: {
    jwt: {
      key: 'kCtfo6go2PQYgXUAYJIqdLkKIxD8C7EwYAFC58kezgQsCzbu+NchwZx+tS/+rQGMFw+kzZHQkkcCz1reSdUgcg=='
    },
    aes: {
      aesKey256: [
        11,
        19,
        1,
        2,
        30,
        5,
        0,
        13,
        8,
        6,
        27,
        3,
        21,
        26,
        7,
        25,
        9,
        20,
        31,
        17,
        22,
        14,
        24,
        23,
        29,
        15,
        4,
        16,
        18,
        28,
        12,
        10
      ]
    }
  },

  settings: {
    'site.name': 'BOX 定投',
    'site.title': 'BOX 定投践行社群',
    'site.slogan': '让时间陪你慢慢变富',
    'filter.type': 'POPULARITY',
    'filter.dayRangeOptions': [3, 7, 15, 0],
    'filter.popularity.enabled': true,
    'wallet.currencies': ['CNB', 'PRS', 'BOX', 'BTC', 'EOS', 'ETH'],
    'menu.links': [{
      name: 'PRESS.one',
      url: 'https://press.one'
    }],
    'permission.isPrivate': true,
    'permission.denyText': '您需要加入【BOX 定投践行群】才能阅读内容',
    'permission.denyActionText': '如何加入？',
    'permission.denyActionLink': 'https://support.exinone.com/hc/zh-cn/articles/360032511651-关于加入-BOX-定投践行群-的说明'
  },

  auth: {
    tokenKey: `${serviceKey}_token`,
    whitelist: {
      mixin: [1095057],
      github: []
    },
    permissionDenyUrl: 'http://localhost:5000/permissionDeny',
    boxGroupToken: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    xueUserExtraApi: 'https://dev.prsdev.club/hub/api/users-extra',
    boxGroupToken: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    xueAdminToken: '06d60bd1df9d5bd240b19c37313f822fd996b61912099e4d843fc0a29caf5895b997e93bbdbe1835359acb8a45f67e07c04d953794784f8ff7a2fd1a4b0103cd'
  },

  telegramBot: {
    enabled: false,
    url: 'http://dev.press.one:8091/forward'
  },

  logoBase64: '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'
};

module.exports = config;