const request = require('request-promise');
const {
  fm,
} = require('../utils');
const ase256cbcCrypto = require('../utils/ase256cbcCrypto');
const config = require('../config');
const Author = require('./author');
const Post = require('./post');
const User = require('./user');
const Cache = require('./cache');
const Receipt = require('./receipt');
const Vote = require('./vote');
const Comment = require('./comment');
const Sync = require('./sync');
const Finance = require('./finance');
const Log = require('./log');
const type = `${config.serviceKey}_CHAIN_SYNC`;
const prsUtil = require('prs-utility');
const qs = require('query-string');

const syncAuthors = async (options = {}) => {
  let stop = false;
  let done = false;
  while (!stop) {
    try {
      const {
        step = 50
      } = options;
      const key = 'AUTHORS_OFFSET';
      const offsetUpdatedAt = await Cache.pGet(type, key) || '';
      const query = qs.stringify({ updated_at: offsetUpdatedAt, count: step }, { skipEmptyString: true });
      const uri = `${config.topic.blockProducerEndpoint}/api/pip2001/${config.topic.topic}/authorization?${query}`;
      console.log(`【CHAIN SYNC】${key}: ${offsetUpdatedAt} | ${uri}`);
      const res = await request({
        uri,
        json: true,
        timeout: 10000
      }).promise();
      const { authorization: authorizations } = res.data;
      const length = authorizations.length;
      if (length === 0) {
        stop = true;
        done = true;
        continue;
      }
      for (const authorization of authorizations) {
        console.log({ authorization });
        await Author.upsert(authorization.user_address, {
          status: authorization.status
        });
        await Cache.pSet(type, key, authorization.updated_at);
      }
      if (length < step) {
        stop = true;
        done = true;
      }
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
    pubDate: new Date(published),
    mimeType: JSON.parse(block.meta).mime.split(';')[0]
  };
  const author = {
    address: block.user_address,
    nickname: authorName,
    avatar,
    bio
  };
  const updatedRId = chainPost.updated_tx_id;
  return {
    author,
    post,
    updatedRId,
    fileHash: JSON.parse(block.data).file_hash
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
  await Post.updateByRId(newRId, {
    viewCount: post.viewCount
  });
  const topics = await post.getTopics({
    where: {
      deleted: false
    }
  });
  await newPost.addTopics(topics);
  await post.removeTopics(topics);
  const favoriteUsers = await post.getFavoriteUsers();
  await newPost.addFavoriteUsers(favoriteUsers);
  await post.removeFavoriteUsers(favoriteUsers);
  return true;
};

const saveChainPost = async (chainPost, options = {}) => {
  if (process.env.NODE_ENV !== 'production' && options.fromChainSync) {
    console.log({ chainPost });
  }

  const IS_EMPTY_FOR_DELETE = !chainPost.content && chainPost.updated_tx_id;
  const IS_EMPTY = !chainPost.content && !chainPost.updated_tx_id;

  if (IS_EMPTY_FOR_DELETE) {
    const post = await Post.getByRId(chainPost.updated_tx_id);
    if (post) {
      await Post.delete(post.rId);
      Log.createAnonymity('删除文章', `${post.rId} ${post.title}`);
    }
    return;
  }

  if (IS_EMPTY) {
    return;
  }

  const rId = chainPost.publish_tx_id;
  const pickedPost = await pickPost(chainPost);
  const {
    author,
    post,
    updatedRId,
    fileHash
  } = pickedPost;

  const existedPost = await Post.getByRId(rId, {
    ignoreDeleted: true,
    ignoreInvisibility: true,
    includeAuthor: false
  });

  if (existedPost) {
    if (options.fromChainSync && (!existedPost.status || existedPost.status === 'pending')) {
      if (prsUtil.sha256(chainPost.content) !== fileHash) {
        console.log('WARNING: mismatch file hash');
      }
      await Post.updateByRId(rId, {
        status: 'finished'
      });
      Log.createAnonymity('ChainSync 同步文章，状态改为 finished', `${rId}`);
    }
    return;
  }

  try {
    const user = await User.getByAddress(author.address);
    if (!user) {
      await Author.upsert(author.address, {
        nickname: author.nickname || author.name || '',
        avatar: author.avatar || '',
        cover: author.cover || '',
        bio: author.bio || '',
      });
    }
  } catch (err) {
    console.log(err);
  }

  if (options.fromChainSync) {
    post.status = 'finished';
  } else if (options.fromPublish) {
    post.status = 'pending';
  }

  if (updatedRId) {
    const updatedFile = await Post.getByRId(updatedRId, {
      ignoreDeleted: true,
      raw: true
    });
    if (updatedFile) {
      post.pubDate = updatedFile.pubDate;
      await Post.create(post);
      await Post.delete(updatedFile.rId);
      await replacePost(updatedRId, post.rId);
      Log.createAnonymity('更新文章，迁移文章关联数据', `${updatedRId} ${post.rId}`);
    } else {
      await Post.create(post);
      Log.createAnonymity('updatedFile not found', `${updatedRId} ${post.rId}`);
    }
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
      const offsetUpdatedAt = await Cache.pGet(type, key) || '';
      const query = qs.stringify({ topic: config.topic.topic, updated_at: offsetUpdatedAt, count: step }, { skipEmptyString: true });
      const uri = `${config.topic.blockProducerEndpoint}/api/pip2001?${query}`;
      console.log(`【CHAIN SYNC】${key}: ${offsetUpdatedAt} | ${uri}`);
      const res = await request({
        uri,
        json: true,
        timeout: 10000
      }).promise();
      const { posts } = res.data;
      const length = posts.length;
      if (length === 0) {
        stop = true;
        continue;
      }
      for (const post of posts) {
        const IS_NEW_OR_UPDATED = post.status === 200 && post.content[0];
        const IS_DELETE = post.status === 404;
        const IS_EMPTY_FOR_DELETE = post.status === 0 && post.updated_tx_id;
        const IS_EMPTY = post.status === 0 && !post.updated_tx_id;

        let content = '';
        if (IS_NEW_OR_UPDATED) {
          const base64Content = post.content[0].replace('data:text/plain; charset=utf-8;base64,', '');
          const rawContentString = Buffer.from(base64Content, 'base64');
          const rawContent = JSON.parse(rawContentString);
          content = ase256cbcCrypto.decrypt(rawContent.session, rawContent.content);
        } else if (IS_EMPTY_FOR_DELETE || IS_DELETE) {
          content = '';
        } else if (IS_EMPTY) {
          console.log(`Post content is empty, maybe it\'s domain is localhost so that block producer can not fetch it\'s content. ${post.publish_tx_id}`);
        } else {
          console.log('The status of this post is invalid');
          console.log(post);
          continue;
        }
        const chainPost = {
          publish_tx_id: post.publish_tx_id,
          file_hash: post.file_hash,
          topic: post.topic,
          updated_tx_id: post.updated_tx_id,
          updated_at: post.updated_at,
          content,
        }
        await saveChainPost(chainPost, {
          fromChainSync: true
        });
        await Cache.pSet(type, key, chainPost.updated_at);
      }
      if (length < step) {
        stop = true;
      }
    } catch (err) {
      console.log(err);
      stop = true;
    }
  }
};

exports.sync = async () => {
  if (!config.topic.blockProducerEndpoint) {
    return;
  }

  // 同步所有 authors
  const syncAuthorsDone = await syncAuthors({
    step: 50
  });
  if (syncAuthorsDone) {
    // 同步所有 posts
    await syncPosts({
      step: 20
    });
  }
};