const crypto = require('crypto');
const router = require('koa-router')();
const multer = require('koa-multer');
const util = require('util');
const fs = require('fs');
const {
  Config,
  QingStor
} = require('qingstor-sdk');
const config = require('../config');
const {
  throws,
} = require('../utils/validator');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const fileFormat = (file.originalname).split(".");
    const now = new Date();
    const prefix = now.getMonth() + 1 + '' + now.getDate() + '-';
    cb(null, prefix + fileFormat[0] + "." + fileFormat[fileFormat.length - 1]);
  }
});

const upload = multer({
  storage
});

router.post('/', upload.single('file'), async (ctx) => {
  const {
    filename,
    mimetype,
    path
  } = ctx.req.file;
  try {
    let qingConfig = new Config(config.qingCloud.accessKeyId, config.qingCloud.secretAccessKey);
    let bucket = new QingStor(qingConfig).Bucket(config.qingCloud.bucketName, config.qingCloud.zone);
    const pPutObject = util.promisify(bucket.putObject.bind(bucket));
    const folder = 'images/';
    const file = await fs.promises.readFile(path)
    const hash = crypto.createHash('sha256');
    hash.update(file);
    const fileHash = hash.digest('hex');
    const res = await pPutObject(folder + fileHash, {
      'Content-Type': mimetype,
      'body': file,
    });
    console.log('res.url', res.url);
    try {
      await fs.promises.unlink(path);
    } catch (err) {
      console.log(err);
    }
    if (res.status > 299) {
      throws('fail to upload');
    }
    ctx.body = {
      filename,
      url: `${config.qingCloud.cdn}/${folder}${decodeURIComponent(res.url).split('/').pop()}`
    };
  } catch (err) {
    throws(err.message);
  }
});

module.exports = router;