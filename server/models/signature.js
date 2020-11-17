const crypto = require('crypto');
const config = require('../config');

const sortedObject = (obj) => {
  return Object.entries(obj).sort().reduce(
    (result, item, idx) => {
      if (
        item[1] !== null &&
        typeof item[1] === 'object' &&
        (!Array.isArray(item[1]))
      ) {
        result[item[0]] = sortedObject(item[1]);
      } else {
        result[item[0]] = item[1];
      }
      return result;
    }, {}
  );
};

const base64ToUrlSafe = (v) => {
  return v.replace(/\//g, '_').replace(/\+/g, '-');
};

const jsonDumps = (obj) => {
  // like python json.dumps
  // we also can using `json.dumps(obj, separators=(',', ':'))` in python, this like `nodejs JSON.stringify`
  // NOTE: this method maybe has bug
  // return JSON.stringify(obj).replace(/":"/g, '": "').replace(/","/g, '", "');
  return JSON.stringify(obj);
};

const _generateSignature = (obj, secretKey, hashAlg = 'sha1') => {
  //计算签名
  // 然后，用 secret_key 对 json.dumps(dict(sorted(data.items()))) 用 sha1 做hmac
  // 最后，对生成的签名做 base64.urlsafe_b64encode 编码
  const sortedObj = sortedObject(obj);
  const hmac = crypto.createHmac(hashAlg, secretKey);
  const digest = hmac.update(jsonDumps(sortedObj)).digest('base64');
  return base64ToUrlSafe(digest);
};

exports.generateSignature = (obj, hashAlg = 'sha1') => {
  if ('project' in obj === false) {
    obj['project'] = config.messageSystem.project;
  }
  if ('access_key' in obj === false) {
    obj['access_key'] = config.messageSystem.accessKey;
  }
  const secretKey = config.messageSystem.secretKey;
  // const secretKey = 'c09ced907b3853e1badf06fa8c586093caee702ccf6699d7';
  return _generateSignature(obj, secretKey);
}
