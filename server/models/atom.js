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
const Mixin = require('./mixin');
const type = `${config.serviceKey}_SYNC_ATOM`;
const Subscription = require('./subscription');

const syncAuthors = async (options = {}) => {
  let stop = false;
  let done = false;
  while (!stop) {
    try {
      const {
        step = 50
      } = options;
      const key = 'AUTHORS_OFFSET';
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
        await Author.upsert(author.user_address, {
          status: author.status
        });
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

const extractFrontMatter = rawPost => {
  const result = fm(rawPost.content);
  return {
    title: result.attributes.title,
    authorName: result.attributes.author,
    avatar: result.attributes.avatar,
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

const pickPost = async rawPost => {
  const rId = rawPost.publish_tx_id;
  const block = await getBlock(rId);
  const {
    title,
    avatar,
    authorName,
    content
  } = extractFrontMatter(rawPost);
  const post = {
    rId,
    userAddress: block.user_address,
    title,
    content,
    paymentUrl: JSON.parse(block.meta).payment_url,
    pubDate: new Date(rawPost.updated_at)
  };
  const author = {
    address: block.user_address,
    name: authorName,
    avatar
  };
  const deleted = rawPost.deleted;
  const updatedRId = rawPost.updated_tx_id;
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
  return true;
};

const syncPosts = async (options = {}) => {
  let stop = false;
  while (!stop) {
    try {
      const {
        step = 20
      } = options;
      const key = 'POSTS_OFFSET';
      const cachedOffset = Number(await Cache.pGet(type, key));
      const offset = cachedOffset > 0 ? cachedOffset : 0;
      const uri = `${config.atom.postsUrl}?topic=${config.atom.topic}&offset=${offset}&limit=${step}`;
      const rawPosts = await request({
        uri,
        json: true,
        timeout: 10000
      }).promise();
      const length = rawPosts.length;
      if (offset === 0 && length === 0) {
        stop = true;
        continue;
      }
      const pickedPosts = await Promise.all(rawPosts.map(pickPost));
      for (const index of pickedPosts.keys()) {
        const {
          author,
          post,
          deleted,
          updatedRId
        } = pickedPosts[index];
        if (deleted) {
          const exists = await Post.getByRId(post.rId);
          if (exists) {
            await Post.delete(post.rId);
            Log.createAnonymity('删除文章', `${post.rId} ${post.title}`);
          }
          continue;
        }
        const insertedAuthor = await Author.getByAddress(author.address);
        if (!insertedAuthor) {
          continue;
        }
        const exists = await Post.getByRId(post.rId, {
          ignoreDeleted: true,
          includeAuthor: false
        });
        if (exists) {
          continue;
        }
        await Author.upsert(author.address, {
          name: author.name,
          avatar: author.avatar
        });
        Log.createAnonymity('同步作者资料', `${author.address} ${author.name}`);
        await Post.create(post);
        Log.createAnonymity('同步文章', `${post.rId} ${post.title}`);
        if (updatedRId) {
          await replacePost(updatedRId, post.rId);
          Log.createAnonymity('迁移文章关联数据', `${updatedRId} ${post.rId}`);
        } else {
          await notifySubscribers({
            address: author.address,
            name: author.name,
            post
          });
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

const notifySubscribers = async (options = {}) => {
  const {
    address,
    name,
    post
  } = options;
  const subscriptions = await Subscription.listSubscribers(address);
  while (subscriptions.length > 0) {
    const subscription = subscriptions.shift();
    const truncatedTitle = post.title.slice(0, 10);
    const postfix = post.title.length > truncatedTitle.length ? '...' : '';
    const postUrl = `${config.serviceRoot}/posts/${post.rId}`;
    await Mixin.pushToNotifyQueue({
      userId: subscription.userId,
      text: `${name}发布《${truncatedTitle}${postfix}》`,
      url: postUrl
    });
  }
}

exports.sync = async () => {
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
};