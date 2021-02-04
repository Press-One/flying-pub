const fs = require('fs');
const rp = require('request-promise');
const config = require('./config');
const util = require('util');
const pReadFile = util.promisify(fs.readFile);
const pWriteFile = util.promisify(fs.writeFile);

exports.initStatic = async () => {
  await tryDownloadFavicon(config.favicon);
  await tryUseStaticCDN(config.staticCDN);
  await tryUpdateRobots(config.serviceRoot);
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
    if (indexHtml.includes(cdn)) {
      return;
    }
    const fragments = indexHtml.toString().split('<');
    const newIndexHtml = fragments.map(item => item.replace(/(?<==").*?(?=\/static)/g, () => cdn || '')).join('<');
    await pWriteFile('./build/index.html', newIndexHtml);
  } catch (e) {
    console.log(e);
  }
}

const tryUpdateRobots = async url => {
  try {
    const text = await pReadFile('./build/robots.txt');
    if (!text.includes('serviceRoot')) {
      return;
    }
    const newText = text.toString().replace(/serviceRoot/g, url);
    await pWriteFile('./build/robots.txt', newText);
  } catch (e) {
    console.log(e);
  }
}
