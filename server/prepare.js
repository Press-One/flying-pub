const fs = require('fs');
const rp = require('request-promise');
const config = require('./config');
const util = require('util');
const pReadFile = util.promisify(fs.readFile);
const pWriteFile = util.promisify(fs.writeFile);

exports.initStatic = async () => {
  await tryDownloadFavicon(config.favicon);
  await tryUseStaticCDN(config.staticCDN);
}

const tryDownloadFavicon = async url => {
  if (!url) {
    return;
  }
  try {
    const body = await rp.get({
      url,
      encoding: 'binary'
    });
    await pWriteFile("./build/favicon.ico", body, 'binary');
  } catch (e) {
    console.log(e);
  }
}

const tryUseStaticCDN = async cdn => {
  try {
    const indexHtml = await pReadFile('./build/index.html');
    const newIndexHtml = indexHtml.toString().replace(/(?<==").*?(?=\/static)/g, () => cdn || '');
    await pWriteFile('./build/index.html', newIndexHtml);
  } catch (e) {
    console.log(e);
  }
}