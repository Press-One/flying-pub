const {
  assert,
  Errors
} = require('../utils/validator');
const prsUtil = require('prs-utility');
const File = require('./sequelize/file');
const Post = require('./post');
const Block = require('./block');
const config = require('../config');
const ase256cbcCrypto = require('../utils/ase256cbcCrypto');

const FILE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  PENDING: 'pending'
}

exports.FILE_STATUS = FILE_STATUS;

const removeFrontMatter = (content = '') => {
  return content = content.replace(/^---(.|\n)*?---\n/, '');
}

const packFile = async (file, options = {}) => {
  assert(file, Errors.ERR_NOT_FOUND('file'));
  delete file.userId;
  const fileJson = file.toJSON();
  const {
    rId
  } = fileJson;
  const isDraft = !rId;
  if (isDraft) {
    fileJson.status = FILE_STATUS.DRAFT;
  } else {
    const block = await Block.get(rId);
    const status = getStatusByBlock(block);
    fileJson.status = status;
    fileJson.block = block;
  }
  if (fileJson.content) {
    fileJson.content = fileJson.content.toString('utf8');
  }
  const {
    withRawContent,
  } = options;
  if (!withRawContent) {
    fileJson.content = removeFrontMatter(fileJson.content);
  }
  const post = await Post.getByRId(rId, {
    ignoreDeleted: true,
    ignoreInvisibility: true,
    includeAuthor: false
  });
  fileJson.postViewCount = post ? post.viewCount : 0;
  delete fileJson.deleted;
  return fileJson;
}

const verifyData = (data, options = {}) => {
  assert(data, Errors.ERR_IS_REQUIRED('data'));

  const {
    isUpdating
  } = options;
  const requiredKeys = [
    'title',
    'content',
    'mimeType'
  ];
  const editableKeys = [
    'rId',
    'title',
    'content',
    'cover',
    'mimeType',
    'description',
    'deleted'
  ];

  if (!isUpdating) {
    for (const key of requiredKeys) {
      let value = data[key];
      switch (key) {
        case 'title':
          assert(value, Errors.ERR_IS_REQUIRED('title'));
          break;
        case 'content':
          assert(value, Errors.ERR_IS_REQUIRED('content'));
          break;
        case 'mimeType':
          assert(value, Errors.ERR_IS_REQUIRED('mimeType'));
          break;
      }
    }
  }

  for (const key in data) {
    assert(editableKeys.includes(key), `${key} is invalid`);
  }
};

exports.create = async (userAddress, data) => {
  assert(userAddress, Errors.ERR_IS_REQUIRED('userAddress'));
  verifyData(data);
  const msghash = prsUtil.sha256(data.content);
  const maybeExistedFile = await exports.getByMsghash(msghash);
  assert(!maybeExistedFile, Errors.ERR_IS_DUPLICATED('msghash'), 409);
  const encryptedContent = JSON.stringify(ase256cbcCrypto.encrypt(data.content));
  data.content = Buffer.from(data.content, 'utf8');
  const payload = {
    ...data,
    userAddress,
    msghash,
    topicAddress: config.topic.address,
    encryptedContent
  };
  const file = await File.create(payload);
  const derivedFile = await packFile(file);
  return derivedFile;
};

exports.list = async (userAddress, options = {}) => {
  const {
    offset,
    limit,
  } = options;
  assert(userAddress, Errors.ERR_IS_REQUIRED('userAddress'));
  const files = await File.findAll({
    attributes: {
      exclude: ['content', 'encryptedContent'],
    },
    where: {
      userAddress,
      deleted: false,
      topicAddress: config.topic.address
    },
    offset,
    limit,
    order: [
      ['createdAt', 'DESC']
    ]
  });
  const list = await Promise.all(
    files.map((file) => {
      return packFile(file, {
        withPostViewCount: options.withPostViewCount
      });
    })
  )
  return list;
};

exports.count = async userAddress => {
  assert(userAddress, Errors.ERR_IS_REQUIRED("userAddress"));
  const count = await File.count({
    where: {
      userAddress,
      deleted: false,
      topicAddress: config.topic.address
    },
  });
  return count;
}

const getStatusByBlock = block => {
  const {
    blockNum,
    blockTransactionId
  } = block;
  if (blockNum && blockTransactionId) {
    return FILE_STATUS.PUBLISHED;
  }
  return FILE_STATUS.PENDING;
}

exports.get = async (id, options = {}) => {
  assert(id, Errors.ERR_IS_REQUIRED('id'));
  const file = await File.findOne({
    where: {
      id,
      deleted: false
    }
  });
  if (!file) {
    return null;
  }
  const {
    withRawContent
  } = options;
  const derivedFile = await packFile(file, {
    withRawContent
  });
  return derivedFile;
};

exports.update = async (id, data) => {
  assert(id, Errors.ERR_IS_REQUIRED('id'));
  verifyData(data, {
    isUpdating: true
  });
  const payload = data;
  if (data.content) {
    const msghash = prsUtil.sha256(data.content);
    const maybeExistedFile = await exports.getByMsghash(msghash);
    assert(!maybeExistedFile, Errors.ERR_IS_DUPLICATED('msghash'), 409);
    const encryptedContent = JSON.stringify(ase256cbcCrypto.encrypt(data.content));
    payload.encryptedContent = encryptedContent;
    data.content = Buffer.from(data.content, 'utf8');
    payload.msghash = msghash;
  }

  await File.update(payload, {
    where: {
      id,
      deleted: false
    }
  });
  const derivedFile = await exports.get(id);
  return derivedFile;
};

exports.hide = async id => {
  assert(id, Errors.ERR_IS_REQUIRED('id'));
  await File.update({
    invisibility: true
  }, {
    where: {
      id
    }
  });
  return true;
};

exports.show = async id => {
  assert(id, Errors.ERR_IS_REQUIRED('id'));
  await File.update({
    invisibility: false
  }, {
    where: {
      id
    }
  });
  return true;
};

exports.delete = async id => {
  assert(id, Errors.ERR_IS_REQUIRED('id'));
  await File.update({
    deleted: true
  }, {
    where: {
      id
    }
  });
  return true;
};

exports.getByMsghash = async (msghash, options = {}) => {
  assert(msghash, Errors.ERR_IS_REQUIRED('msghash'));
  const where = {
    msghash,
    deleted: false
  };
  const {
    ignoreDeleted
  } = options;
  if (ignoreDeleted) {
    delete where.deleted;
  }
  const file = await File.findOne({
    where
  });
  if (!file) {
    return null
  }
  const {
    withRawContent
  } = options;
  const derivedFile = await packFile(file, {
    withRawContent
  });
  return derivedFile;
};

exports.getByRId = async (rId) => {
  assert(rId, Errors.ERR_IS_REQUIRED('rId'));
  const file = await File.findOne({
    where: {
      rId,
      deleted: false
    }
  });
  if (!file) {
    return null
  }
  const derivedFile = await packFile(file);
  return derivedFile;
};