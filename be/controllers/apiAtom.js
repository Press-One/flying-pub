const config = require('../config');
const request = require('request-promise');

exports.get = async (ctx) => {
  try {
    const atom = await request({
      uri: `${config.atomUrl}`
    }).promise();
    ctx.body = atom;
    // ctx.body = `<feed xmlns="http://www.w3.org/2005/Atom"><title></title><id></id><updated></updated><entry><title>定投改变命运（第三版连载）1</title><id>f9850f886c9f3e3ca2f3f427a138a681ca9eb365240a493050b5c05a55f34262</id><updated></updated><author><name>raimonfuns</name></author><published>2019-11-12T03:24:47.836Z</published><content type="text/markdown"><![CDATA[---
    //   title: 定投改变命运（第三版连载）1
    //   author: raimonfuns
    //   avatar: https://avatars3.githubusercontent.com/u/8716838?v=4
    //   published: 2019-11-12T03:24:47.836Z
    //   ---
    //   ![](https://pek3b.qingstor.com/pub-images/8f62ee39a73c0dde3a45d95bc3bd1ca2cca87a20)

    //   ## 警告

    //   金融领域是认知变现的最佳场所，可与此同时，也从来没有任何一个其他领域像金融领域那样，毫不留情地严厉惩罚缺乏正确独立思考能力的人。
    // ]]></content></entry></feed>`
  } catch (err) {
    ctx.er(err);
  }
}