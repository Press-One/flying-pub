const Post = require('../models/post');
const config = require('../config');
const Log = require('../models/log');
const convert = require('xml-js');
const fetch = require('node-fetch');
const {
  assert,
  Errors,
} = require('../utils/validator');

exports.get = async ctx => {
  if (!(config && config.search && config.search.enabled)) {
    return;
  }
  const userId = ctx.verification && ctx.verification.user.id;
  try {
    const res = await fetch(`${config.search.searchUrl}?${ctx.querystring}`);
    const json = await res.json();
    if (userId) {
      Log.create(userId, `【搜索】${ctx.query.q}`);
    }
    ctx.body = json;
  } catch(e) {}
};

exports.post = async ctx => {
  if (!(config && config.search && config.search.enabled)) {
    return;
  }
  const { uri } = ctx.request.body || {};
  assert(uri, Errors.ERR_IS_REQUIRED('uri'));
  const rId = uri.split('/').pop();
  assert(rId, Errors.ERR_IS_INVALID('uri'));
  const post = await Post.getByRId(rId, {
    raw: true,
    withContent: true,
  });
  assert(post, Errors.ERR_NOT_FOUND('post'))
  const { title, content, userAddress } = post;
  const xmlObject = {
    '_declaration':{'_attributes':{'version':'1.0','encoding':'utf-8'}},
    node: {
      cy_tenantid: {
        '_attributes': { 'type': 'cypress.untoken' },
        '_text': config.settings['site.name'],
      },
      date: {
        '_attributes': { 'type': 'cypress.int' },
        '_text': Math.floor(new Date() / 1000),
      },
      xmluri: uri,
      uri,
      title: {"_cdata": title},
      content: {"_cdata": content},
      user_address: userAddress,
    }
  }
  const xmlString = convert.js2xml(xmlObject, {compact: true, spaces: 8});
  console.log(xmlString);
  const userId = ctx.verification && ctx.verification.user.id;
  try {
    const res = await fetch(config.search.updatertUrl, {
      method: 'post',
      body: xmlString,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    });
    const json = await res.json();
    console.log(json);
    if (userId) {
      Log.create(userId, `【更新索引】${uri}`);
    }
    ctx.body = json;
  } catch(e) {
    console.error(e);
  }
};
