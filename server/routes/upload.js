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
const {
  mimeTypes
} = require('../utils');

const getPostfix = mimetype => {
  for (const key in mimeTypes) {
    if (mimeTypes[key] === mimetype) {
      return key;
    }
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync('build')) {
      fs.mkdirSync('build');
    }
    cb(null, 'build/')
  },
  filename: function (req, file, cb) {
    const { mimetype } = file;
    const postfix = getPostfix(mimetype);
    if (config.qingCloud) {
      const now = new Date();
      const prefix = now.getMonth() + 1 + '' + now.getDate();
      cb(null, prefix + "." + postfix);
    } else {
      cb(null, new Date().getTime() + "." + postfix)
    }
  }
});

const upload = multer({
  storage
});

router.post('/', upload.single('file'), async (ctx) => {
  console.log({ file: ctx.req.file });
  const {
    filename,
    mimetype,
    path
  } = ctx.req.file;
  
  if (!config.qingCloud) {
    console.log({ filename, path });
    ctx.body = {
      filename: filename,
      url: `${config.serviceRoot}/${filename}`
    }
    return;
  }

  try {
    let qingConfig = new Config(config.qingCloud.accessKeyId, config.qingCloud.secretAccessKey);
    let bucket = new QingStor(qingConfig).Bucket(config.qingCloud.bucketName, config.qingCloud.zone);
    const pPutObject = util.promisify(bucket.putObject.bind(bucket));
    const folder = '';
    const file = await fs.promises.readFile(path)
    const hash = crypto.createHash('sha256');
    hash.update(file);
    const fileHash = hash.digest('hex');
    const uniqueFileName = fileHash.slice(0, 4) + filename;
    const res = await pPutObject(folder + uniqueFileName, {
      'Content-Type': mimetype,
      'body': file,
    });
    try {
      await fs.promises.unlink(path);
    } catch (err) {
      console.log(err);
    }
    if (res.status > 299) {
      throws('fail to upload');
    }
    ctx.body = {
      filename: uniqueFileName,
      url: `${config.qingCloud.cdn}/${folder}${decodeURIComponent(res.url).split('/').pop()}`
    };
  } catch (err) {
    throws(err.message);
  }
});

module.exports = router;