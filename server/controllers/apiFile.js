const File = require("../models/file");
const User = require("../models/user");
const config = require('../config');
const {
  assert,
  Errors
} = require("../utils/validator");
const Log = require("../models/log");
const Post = require("../models/post");
const Block = require('../models/block');
const Permission = require('../models/permission');
const Chain = require("./chain");
const {
  truncate,
  sleep
} = require("../utils");
const {
  pushToNotificationQueue,
} = require("../models/notification");
const { postToSearchService, deleteFromSearchService } = require('./apiSearch');

exports.list = async ctx => {
  const {
    offset = 0, limit = 10, type
  } = ctx.query;
  const {
    user
  } = ctx.verification;
  const files = await File.list(user.address, {
    type,
    offset,
    limit: Math.min(~~limit, 50),
  });
  const total = await File.count(user.address, {
    type
  });
  ctx.body = {
    total,
    files
  };
};

const getFrontMatter = (user, data) => {
  return `---
title: ${data.title}
author: ${user.nickname ? user.nickname : ''}
avatar: ${user.avatar ? user.avatar : ''}
bio: ${user.bio ? user.bio : ''}
cover: ${data.cover || ''}
published: ${new Date().toISOString()}
---\n`;
};

const tryAppendFrontMatter = (user, data) => {
  if (data.content) {
    data.content = getFrontMatter(user, data) + data.content.trim();
    data.content = data.content.trim();
  }
  return data;
};

const createFile = async (user, data, options = {}) => {
  const {
    isDraft
  } = options;
  const shouldPushToChain = !isDraft;
  const derivedData = tryAppendFrontMatter(user, data);
  let file = await File.create(user.address, derivedData);
  if (shouldPushToChain) {
    const fileToChain = await File.get(file.id, {
      withRawContent: true
    });
    const {
      updatedFile,
      origin
    } = options;
    let block;
    try {
      block = await Chain.pushFile(fileToChain, {
        user,
        updatedFile,
        origin
      });
    } catch (err) {
      await File.delete(file.id);
      throw err;
    }
    const rId = block.id;
    file = await File.update(file.id, {
      rId
    });
    const postUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${rId}`;
    if (updatedFile) {
      Log.create(user.id, `发布更新的文章《${file.title}》 ${postUrl}`);
    } else {
      Log.create(user.id, `发布文章《${file.title}》 ${postUrl}`);
      (async () => {
        try {
          await pushToNotificationQueue({
            mixin: {
              userId: user.id,
              text: `${truncate(file.title)}`,
              url: postUrl,
              desc: '已发布',
            },
          })
        } catch (err) {
          console.log(err);
        }
      })();
    }
  }
  const editorInfo = data.mimeType.includes('json') ? '使用新编辑器' : '';
  Log.create(user.id, `${editorInfo}创建文章 ${file.title} ${file.id}`);
  return file;
};
exports.createFile = createFile;

exports.create = async ctx => {
  const userId = ctx.verification.user.id;
  const user = await User.get(userId, {
    withKeys: true
  });
  const data = ctx.request.body.payload;
  const isDraft = ctx.query.type === "DRAFT";
  assert(data, Errors.ERR_IS_REQUIRED("data"));

  const topic = config.topic.address;
  const allowBlock = await Block.getAllowBlock(topic, user.address);
  if (topic && !allowBlock) {
    await Permission.setPermission({
      userAddress: user.address,
      topic,
      type: 'allow',
    })
    const block = await Chain.pushTopicAuthorization({
      userAddress: user.address,
      type: 'allow',
    });
    Log.create(user.id, `提交 allow 区块, blockId ${block.id}`);
  }

  const file = await createFile(user, data, {
    isDraft,
    origin: ctx.request.body.origin
  });
  ctx.body = file;
};

exports.hide = async ctx => {
  const {
    user
  } = ctx.verification;
  const id = ~~ctx.params.id;
  const file = await File.get(id);
  assert(file, Errors.ERR_NOT_FOUND("file"));
  assert(file.userAddress === user.address, Errors.ERR_NO_PERMISSION);
  await Post.updateByRId(file.rId, {
    invisibility: true
  });
  await File.hide(id);
  Log.create(user.id, `隐藏文章 ${file.title} ${file.id}`);
  if (config.search && config.search.enabled) {
    (async () => {
      await deleteFromSearchService(`/posts/${file.rId}`, file);
      Log.createAnonymity('搜索服务',`删除文章《${file.title}》索引 /posts/${file.rId}`);
    })();
  }
  ctx.body = true;
};

exports.show = async ctx => {
  const {
    user
  } = ctx.verification;
  const id = ~~ctx.params.id;
  const file = await File.get(id);
  assert(file, Errors.ERR_NOT_FOUND("file"));
  assert(file.userAddress === user.address, Errors.ERR_NO_PERMISSION);
  await Post.updateByRId(file.rId, {
    invisibility: false
  });
  await File.show(id);
  Log.create(user.id, `显示文章 ${file.title} ${file.id}`);
  if (config.search && config.search.enabled) {
    (async () => {
      await postToSearchService(`/posts/${file.rId}`, file);
      Log.createAnonymity('搜索服务',`更新文章《${file.title}》索引 /posts/${file.rId}`);
    })();
  }
  ctx.body = true;
};

exports.remove = async ctx => {
  const userId = ctx.verification.user.id;
  const user = await User.get(userId, {
    withKeys: true
  });
  const id = ~~ctx.params.id;
  const file = await File.get(id);
  assert(file, Errors.ERR_NOT_FOUND("file"));
  assert(file.userAddress === user.address, Errors.ERR_NO_PERMISSION);
  if (file.status !== 'draft') {
    const emptyFile = File.getEmptyFile(user.address);
    const block = await Chain.pushFile(emptyFile, {
      user,
      updatedFile: file,
      origin: ctx.request.body.origin
    });
    Log.create(user.id, `提交空文章以删除旧文章 ${block.id}`);
    if (config.search && config.search.enabled) {
      (async () => {
        await deleteFromSearchService(`/posts/${file.rId}`, file);
        Log.createAnonymity('搜索服务',`删除文章《${file.title}》索引 /posts/${file.rId}`);
      })();
    }
  }
  await File.delete(id);
  Log.create(user.id, `删除文章 ${file.title} ${file.id}`);
  ctx.body = true;
};

exports.update = async ctx => {
  const userId = ctx.verification.user.id;
  const user = await User.get(userId, {
    withKeys: true
  });
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED("data"));
  const id = ~~ctx.params.id;
  const file = await File.get(id);
  assert(file.userAddress === user.address, Errors.ERR_NO_PERMISSION);
  const {
    rId
  } = file;
  const isDraft = !rId;
  if (isDraft) {
    const derivedData = tryAppendFrontMatter(
      user,
      {
        title: data.title || file.title,
        content: data.content,
        cover: data.cover || file.cover,
      },
    );
    let updatedFile = await File.update(file.id, derivedData);
    const shouldPushToChain = ctx.query.action === "PUBLISH";
    if (shouldPushToChain) {
      const fileToChain = await File.get(file.id, {
        withRawContent: true
      });
      const block = await Chain.pushFile(fileToChain, {
        user,
        origin: ctx.request.body.origin
      });
      const rId = block.id;
      await File.update(updatedFile.id, {
        rId
      });
      updatedFile = await File.get(updatedFile.id);
      const postUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${rId}`;
      Log.create(user.id, `发布草稿《${file.title}》 ${postUrl}`);
      (async () => {
        try {
          await pushToNotificationQueue({
            mixin: {
              userId: user.id,
              text: `${truncate(file.title)}`,
              url: postUrl,
              desc: '已发布',
            },
          })
        } catch (err) {
          console.log(err);
        }
      })();
    }
    ctx.body = {
      updatedFile
    };
  } else {
    const newFile = await createFile(user, data, {
      updatedFile: file,
      origin: ctx.request.body.origin
    });
    await File.delete(file.id);
    Log.create(
      user.id,
      `更新后的文章 ${newFile.title}，id ${newFile.id}`
    );
    Log.create(
      user.id,
      `被替换的文章 ${file.title}，id ${file.id}`
    );
    if (config.search && config.search.enabled) {
      (async () => {
        await deleteFromSearchService(`/posts/${file.rId}`, file);
        Log.createAnonymity('搜索服务',`删除文章《${file.title}》索引 /posts/${file.rId}`);
      })();
    }
    ctx.body = {
      newFile,
      updatedFile: file
    };
  }
};

exports.get = async ctx => {
  const {
    user
  } = ctx.verification;
  const id = ~~ctx.params.id;
  const file = await File.get(id);
  assert(file, Errors.ERR_NOT_FOUND("file"));
  assert(file.userAddress === user.address, Errors.ERR_NO_PERMISSION);
  ctx.body = file;
};

exports.getByRId = async ctx => {
  const {
    user
  } = ctx.verification;
  const rId = ctx.params.rId;
  const file = await File.getByRId(rId);
  assert(file, Errors.ERR_NOT_FOUND("file"));
  assert(file.userAddress === user.address, Errors.ERR_NO_PERMISSION);
  ctx.body = file;
};
