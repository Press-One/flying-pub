const Parser = require('rss-parser');
const request = require('request-promise');
const {
  fm
} = require('../utils');
const config = require('../config');
const Author = require('./author');
const Post = require('./post');
const Cache = require('./cache');
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
      const offset = Number(await Cache.pGet(type, key)) || 0;
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

const extractFrontMatter = post => {
  const result = fm(post.content);
  return {
    title: result.attributes.title,
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

const extractPost = async post => {
  const rId = post.publish_tx_id;
  const block = await getBlock(rId);
  const {
    title,
    avatar,
    content
  } = extractFrontMatter(post);
  const derivedPost = {
    rId,
    userAddress: block.user_address,
    title,
    content,
    paymentUrl: JSON.parse(block.meta).payment_url,
    pubDate: new Date(post.updated_at)
  };
  const author = {
    address: block.user_address,
    name: post.author,
    avatar
  };
  const deleted = post.deleted;
  return {
    deleted,
    author,
    derivedPost
  };
};

const syncPosts = async (options = {}) => {
  let stop = false;
  while (!stop) {
    try {
      const {
        step = 20
      } = options;
      const key = 'POSTS_OFFSET';
      const offset = Number(await Cache.pGet(type, key)) || 0;
      const uri = `${config.atom.postsUrl}?topic=${config.atom.topic}&offset=${offset}&limit=${step}`;
      const posts = await request({
        uri,
        headers: {
          'accept-encoding': 'gzip'
        },
        timeout: 10000
      }).promise();
      console.log(` ------------- posts ---------------`, posts);
      if (posts.length === 0) {
        stop = true;
        continue;
      }
      const derivedPosts = await Promise.all(posts.map(extractPost));
      for (const index of derivedPosts.keys()) {
        const {
          deleted,
          author,
          derivedPost
        } = derivedPosts[index];
        if (deleted) {
          await Post.delete(derivedPost.rId);
          Log.createAnonymity('删除文章', `${derivedPost.rId} ${derivedPost.title}`)
          continue;
        }
        const insertedAuthor = await Author.getByAddress(author.address);
        if (!insertedAuthor) {
          continue;
        }
        await Author.upsert(author.address, {
          name: author.name,
          avatar: author.avatar
        });
        Log.createAnonymity('同步作者资料', `${author.address} ${author.name}`);
        await Post.create(derivedPost);
        Log.createAnonymity(
          '同步文章',
          `${derivedPost.rId} ${derivedPost.title}`
        );
      }
      const newOffset = offset + posts.length;
      await Cache.pSet(type, key, newOffset);
    } catch (err) {
      console.log(err);
      stop = true;
    }
  }
};

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