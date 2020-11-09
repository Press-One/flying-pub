const request = require('request-promise');
const {
  fm
} = require('../utils');
const config = require('../config');
const Author = require('./author');
const Post = require('./post');
const Cache = require('./cache');
const Receipt = require('./receipt');
const Vote = require('./vote');
const Comment = require('./comment');
const Sync = require('./sync');
const Finance = require('./finance');
const Log = require('./log');
const type = `${config.serviceKey}_SYNC_ATOM`;

const syncAuthors = async (options = {}) => {
  let stop = false;
  let done = false;
  while (!stop) {
    try {
      const {
        step = 50
      } = options;
      const key = 'AUTHORS_OFFSET';
      const lastUpdatedAtKey = 'AUTHORS_LAST_UPDATED_AT';
      const cachedOffset = Number(await Cache.pGet(type, key));
      const offset = cachedOffset > 0 ? cachedOffset : 0;
      const uri = `${config.atom.authorsUrl}?topic=${
        config.atom.topic
      }&offset=${offset < 0 ? 0 : offset}&limit=${step}`;
      const authors = await request({
        uri,
        json: true,
        timeout: 5000
      }).promise();
      const length = authors.length;
      if (offset === 0 && length === 0) {
        stop = true;
        return;
      }
      for (const author of authors) {
        const cachedLastUpdatedAt = await Cache.pGet(type, lastUpdatedAtKey);
        const isNew = !cachedLastUpdatedAt || new Date(author.updated_at) > new Date(cachedLastUpdatedAt);
        if (isNew) {
          await Author.upsert(author.user_address, {
            status: author.status
          });
          await Cache.pSet(type, lastUpdatedAtKey, author.updated_at);
        }
      }
      let offsetIncrement = 0;
      if (length < step) {
        // user 历史记录会改变，更新的 user 会排在最后，所以 offset 每次多抓 10 条，确保能抓到更新的 user 数据
        if (length === 0) {
          offsetIncrement = -10;
        } else if (length > 10) {
          offsetIncrement = length - 10;
        }
        stop = true;
        done = true;
      } else {
        offsetIncrement = length;
      }
      const newOffset = offset + offsetIncrement;
      await Cache.pSet(type, key, newOffset);
    } catch (err) {
      console.error(err);
      stop = true;
    }
  }
  return done;
};

const extractFrontMatter = chainPost => {
  const result = fm(chainPost.content);
  return {
    title: result.attributes.title,
    authorName: result.attributes.author,
    avatar: result.attributes.avatar,
    bio: result.attributes.bio,
    cover: result.attributes.cover,
    published: result.attributes.published,
    content: result.body
  };
};

const getBlock = async rId => {
  const blocks = await request({
    uri: `https://press.one/api/v2/blocks/${rId}`,
    json: true,
    timeout: 10000
  }).promise();
  const block = blocks[0];
  return block;
};

const pickPost = async chainPost => {
  const rId = chainPost.publish_tx_id;
  const block = await getBlock(rId);
  const {
    title,
    avatar,
    authorName,
    bio,
    cover,
    published,
    content
  } = extractFrontMatter(chainPost);
  const post = {
    rId,
    userAddress: block.user_address,
    title,
    cover,
    content,
    paymentUrl: JSON.parse(block.meta).payment_url,
    pubDate: new Date(published)
  };
  const author = {
    address: block.user_address,
    nickname: authorName,
    avatar,
    bio
  };
  const deleted = chainPost.deleted;
  const updatedRId = chainPost.updated_tx_id;
  return {
    author,
    post,
    deleted,
    updatedRId
  };
};

const replacePost = async (rId, newRId) => {
  await Promise.all([
    Receipt.replaceObjectRId(rId, newRId),
    Vote.replaceObjectId(rId, newRId, 'posts'),
    Comment.replaceObjectId(rId, newRId)
  ]);
  await Promise.all([
    Finance.syncRewardAmount(newRId),
    Sync.syncVote('posts', newRId),
    Sync.syncComment(newRId)
  ]);
  await Post.updateByRId(rId, {
    latestRId: newRId
  });
  await Post.updateLatestRId(rId, newRId);
  const [post, newPost] = await Promise.all([
    Post.getByRId(rId, {
      ignoreDeleted: true,
      raw: true
    }),
    Post.getByRId(newRId, {
      ignoreDeleted: true,
      raw: true
    }),
  ]);
  const topics = await post.getTopics({
    where: {
      deleted: false
    }
  });
  await newPost.addTopics(topics);
  await post.removeTopics(topics);
  return true;
};

const saveChainPost = async (chainPost, options = {}) => {
  const pickedPost = await pickPost(chainPost);
  const {
    author,
    post,
    deleted,
    updatedRId
  } = pickedPost;
  const insertPost = await Post.getByRId(post.rId, {
    ignoreDeleted: true,
    ignoreInvisibility: true,
    includeAuthor: false
  });

  if (insertPost) {
    if (options.fromAtomSync && (!insertPost.status || insertPost.status === 'pending')) {
      await Post.updateByRId(post.rId, {
        status: 'finished'
      });
      Log.createAnonymity('Atom 同步文章，状态改为 finished', `${post.rId} ${post.title}`);
    }
    return;
  }

  if (deleted) {
    const exists = await Post.getByRId(post.rId);
    if (exists) {
      await Post.delete(post.rId);
      Log.createAnonymity('删除文章', `${post.rId} ${post.title}`);
    }
    return;
  }

  const user = await User.getByAddress(author.address) || {};
  await Author.upsert(author.address, {
    nickname: user.nickname || author.nickname || author.name || '',
    avatar: user.avatar || author.avatar || '',
    cover: user.cover || author.cover || '',
    bio: user.bio || author.bio || '',
  });

  if (options.fromAtomSync) {
    post.status = 'finished';
  } else if (options.fromPublish) {
    post.status = 'pending';
  }

  if (updatedRId) {
    const updatedFile = await Post.getByRId(updatedRId, {
      ignoreDeleted: true,
      raw: true
    });
    post.pubDate = updatedFile.pubDate;
    await Post.create(post);
    Log.createAnonymity('同步文章', `${post.rId} ${post.title}`);
    await Post.delete(updatedFile.rId);
    Log.createAnonymity('删除文章', `${updatedFile.rId} ${updatedFile.title}`);
    await replacePost(updatedRId, post.rId);
    Log.createAnonymity('迁移文章关联数据', `${updatedRId} ${post.rId}`);
  } else {
    await Post.create(post);
    Log.createAnonymity('同步文章', `${post.rId} ${post.title}`);
  }
}
exports.saveChainPost = saveChainPost;

const syncPosts = async (options = {}) => {
  let stop = false;
  while (!stop) {
    try {
      const {
        step = 20
      } = options;
      const key = 'POSTS_OFFSET';
      const lastUpdatedAtKey = 'POSTS_LAST_UPDATED_AT';
      const cachedOffset = Number(await Cache.pGet(type, key));
      const offset = cachedOffset > 0 ? cachedOffset : 0;
      const uri = `${config.atom.postsUrl}?topic=${config.atom.topic}&offset=${offset}&limit=${step}`;
      const chainPosts = await request({
        uri,
        json: true,
        timeout: 10000
      }).promise();
      const length = chainPosts.length;
      if (offset === 0 && length === 0) {
        stop = true;
        continue;
      }
      while (chainPosts.length > 0) {
        const chainPost = chainPosts.shift();
        const cachedLastUpdatedAt = await Cache.pGet(type, lastUpdatedAtKey);
        const isNew = !cachedLastUpdatedAt || new Date(chainPost.updated_at) > new Date(cachedLastUpdatedAt);
        if (isNew) {
          await saveChainPost(chainPost, {
            fromAtomSync: true
          });
          await Cache.pSet(type, lastUpdatedAtKey, chainPost.updated_at);
        }
      }
      let offsetIncrement = 0;
      if (length < step) {
        // post 历史记录会改变，更新的 post 会排在最后，所以 offset 每次多抓 10 条，确保能抓到更新的 post 数据
        if (length === 0) {
          offsetIncrement = -5;
        } else if (length > 5) {
          offsetIncrement = length - 5;
        }
        stop = true;
        done = true;
      } else {
        offsetIncrement = length;
      }
      const newOffset = offset + offsetIncrement;
      await Cache.pSet(type, key, newOffset);
    } catch (err) {
      console.log(err);
      stop = true;
    }
  }
};

exports.sync = async () => {
  if (!config.atom) {
    return;
  }

  if (!config.shouldSyncPendingBlocks) {
    // 同步所有 authors
    const syncAuthorsDone = await syncAuthors({
      step: 50
    });
    if (syncAuthorsDone) {
      // 同步所有 posts
      await syncPosts({
        step: 10
      });
    }
  }
};