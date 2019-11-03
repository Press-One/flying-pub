const config = require('../config');
const request = require('request-promise');

exports.get = async (ctx) => {
  // const atom = await request({
  //   uri: `https://xue-posts.xue.cn/output/${config.topicAddress}`
  // }).promise();
  const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><title></title><id></id><updated></updated><entry><title>对目标网站7天内发起百万次api请求，是攻击还是正常请求？</title><id>c3f36d65714d0ae6136c0eec9d7dde32a3d85753d3dc4c3a8615de58a60bd768</id><updated></updated><author><name>liujuanjuan1984</name></author><published>2019-09-27T08:26:03.469Z</published><content type="text/markdown"><![CDATA[
  好啦，以上就是我为自己备好的③个锦囊。如果对你有用，要告诉我！自学python不易，此路应携手，一定要告诉我！自学python不易，此路应携手前行。以上就是我为自己备好的③个锦囊。如果对你有用，一定要告诉我！自学python不易，此路应携手前行。]]></content></entry></feed>`
  ctx.set('Content-Type', "application/atom+xml; charset=utf-8");
  ctx.body = atom;
}