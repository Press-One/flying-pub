const Post = require('../models/post');
const config = require('../config');
const Log = require('../models/log');
const convert = require('xml-js');
const fetch = require('node-fetch');
const marked = require('marked');
const editorJsDataToHTML = require('../utils/editorJsDataToHTML');
const { htmlToText } = require('html-to-text');
const querystring = require('querystring');
const {
  assert,
  Errors,
} = require('../utils/validator');

const htmlToTextOptions = {
  wordwrap: false,
  tags: {
    'a': { options: { ignoreHref: true } } ,
    'img': { format: 'skip' },
  }
};

const postToSearchService = (uri, post) => {
  return new Promise(async (resolve, reject) => {
    const { title, content, userAddress, mimeType} = post;
    let contentHtml = '';
    let contentText = content;
    if (mimeType === 'text/markdown') {
      contentHtml = marked.parse(content);
      contentText = htmlToText(contentHtml, htmlToTextOptions);
    } else if (mimeType === 'application/json') {
      contentHtml = editorJsDataToHTML(JSON.parse(content));
      contentText = htmlToText(contentHtml, htmlToTextOptions);
    } 
    const xmlObject = {
      '_declaration':{'_attributes':{'version':'1.0','encoding':'utf-8'}},
      node: {
        cy_tenantid: {
          '_attributes': { 'type': 'cypress.untoken' },
          '_text': config.serviceKey,
        },
        date: {
          '_attributes': { 'type': 'cypress.int' },
          '_text': Math.floor(new Date() / 1000),
        },
        xmluri: config.search.xmluriHost + uri,
        uri,
        title: {"_cdata": title},
        content: {"_cdata": contentText},
        user_address: userAddress,
      }
    }
    const xmlString = convert.js2xml(xmlObject, {compact: true, spaces: 8});
    try {
      const res = await fetch(config.search.updatertUrl, {
        method: 'post',
        body: xmlString,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
      });
      const json = await res.json();
      resolve(json);
    } catch (e) {
      reject(e);
    }
  })
}

exports.postToSearchService = postToSearchService;

exports.get = async ctx => {
  if (!(config && config.search && config.search.enabled)) {
    return;
  }
  const userId = ctx.verification && ctx.verification.user.id;
  try {
    const res = await fetch(`${config.search.searchUrl}?${ctx.querystring}&cy_tenantid=${config.serviceKey}`);
    const json = await res.json();
    if (userId) {
      Log.create(userId, `【搜索】${ctx.query.q}`);
    }
    ctx.body = json;
  } catch(e) {
    console.log(e);
  }
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
  try {
    const json = await postToSearchService(uri, post);
    const userId = ctx.verification && ctx.verification.user.id;
    if (userId) {
      Log.create(userId, `【更新索引】${uri}`);
    }
    ctx.body = json;
  } catch(e) {
    console.error(e);
  }
};

exports.del = async ctx => {
  if (!(config && config.search && config.search.enabled)) {
    return;
  }
  const { uri } = ctx.request.body || {};
  assert(uri, Errors.ERR_IS_REQUIRED('uri'));
  const rId = uri.split('/').pop();
  assert(rId, Errors.ERR_IS_INVALID('uri'));
  const xmlObject = {
    '_declaration':{'_attributes':{'version':'1.0','encoding':'utf-8'}},
    node: {
      xmluri: config.search.xmluriHost + uri,
    }
  }
  const xmlString = convert.js2xml(xmlObject, {compact: true, spaces: 8});
  const userId = ctx.verification && ctx.verification.user.id;
  try {
    const res = await fetch(config.search.deleteUrl, {
      method: 'post',
      body: xmlString,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    });
    const json = await res.json();
    if (userId) {
      Log.create(userId, `【删除索引】${uri}`);
    }
    ctx.body = json;
  } catch(e) {
    console.error(e);
  }
};
