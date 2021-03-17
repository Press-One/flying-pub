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
const prsAtm = require('prs-atm');
const qs = require('query-string');
const { sleep } = require('../utils');
const Block = require('./block');

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
      const uri = `${config.topic.blockProducerEndpoint}/api/pip2001/${config.topic.account}/authorization?${query}`;
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
      await sleep(500);
    } catch (err) {
      console.error(err);
      stop = true;
    }
  }
  return done;
};

const extractFrontMatter = chainPost => {
  const result = fm(chainPost.derive.rawContent);
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

const pickPostAndAuthor = async chainPost => {
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
    rId: chainPost.id,
    userAddress: chainPost.user_address,
    title,
    cover,
    content,
    paymentUrl: chainPost.meta.payment_url,
    pubDate: new Date(published),
    mimeType: chainPost.meta.mime.split(';')[0]
  };
  const author = {
    address: chainPost.user_address,
    nickname: authorName,
    avatar,
    bio
  };
  return {
    author,
    post,
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

  const IS_EMPTY_FOR_DELETE = !chainPost.derive.rawContent && chainPost.data.updated_tx_id;
  const IS_EMPTY = !chainPost.derive.rawContent && !chainPost.data.updated_tx_id;

  if (IS_EMPTY_FOR_DELETE) {
    const post = await Post.getByRId(chainPost.data.updated_tx_id);
    if (post) {
      await Post.delete(post.rId);
      Log.createAnonymity('删除文章', `${post.rId} ${post.title}`);
    }
    return;
  }

  if (IS_EMPTY) {
    return;
  }

  const rId = chainPost.id;
  const updatedRId = chainPost.data.updated_tx_id;
  const {
    post,
    author,
  } = await pickPostAndAuthor(chainPost);

  const existedPost = await Post.getByRId(rId, {
    ignoreDeleted: true,
    ignoreInvisibility: true,
    includeAuthor: false
  });

  if (existedPost) {
    if (options.fromChainSync && (!existedPost.status || existedPost.status === 'pending')) {
      if (prsAtm.encryption.hash(chainPost.derive.rawContent) !== chainPost.data.file_hash) {
        console.log('WARNING: mismatch file hash');
      }
      try {
        await Block.update(rId, {
          blockNum: chainPost.block_num,
          blockTransactionId: chainPost.transaction_id
        });
      } catch (err) {
        console.log(err);
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
    if (!post.content) {
      Log.createAnonymity('内容为空，不给这个区块创建文章', `${post.rId}`);
      return;
    }
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
      const query = qs.stringify({ topic: config.topic.account, updated_at: offsetUpdatedAt, count: step }, { skipEmptyString: true });
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
      for (const chainPost of posts) {
        const IS_NEW_OR_UPDATED = chainPost.snapshot.status === 200 && chainPost.snapshot.content[0];
        const IS_DELETE = chainPost.snapshot.status === 404;
        const IS_EMPTY_FOR_DELETE = chainPost.snapshot.status === 0 && chainPost.data.updated_tx_id;
        const IS_EMPTY = chainPost.snapshot.status === 0 && !chainPost.data.updated_tx_id;

        let rawContent = '';
        if (IS_NEW_OR_UPDATED) {
          const base64EncryptedContent = chainPost.snapshot.content[0].split(';base64,').pop();
          const encryptedContentString = Buffer.from(base64EncryptedContent, 'base64').toString();
          const encryptedContent = JSON.parse(encryptedContentString);
          rawContent = ase256cbcCrypto.decrypt(encryptedContent.session, encryptedContent.content);
        } else if (IS_EMPTY_FOR_DELETE || IS_DELETE) {
          rawContent = '';
        } else if (IS_EMPTY) {
          console.log(`Failed to access resource service. ${chainPost.publish_tx_id}`);
        } else {
          console.log('The status of this post is invalid');
          console.log(chainPost);
          continue;
        }
        chainPost.derive = {
          rawContent
        };
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