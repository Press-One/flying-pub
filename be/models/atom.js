const Parser = require('rss-parser');
const request = require('request-promise');
const fm = require('front-matter');
const config = require('../config');
const Author = require('./author');
const Post = require('./post');
const Cache = require('./cache');
const Log = require('./log');
const PostExtra = require('./posts-extra');
const type = `${config.serviceKey}_SYNC_ATOM`;

const syncAuthors = async (options = {}) => {
  console.log(` ------------- 同步作者 ---------------`);
  let stop = false;
  let done = false;
  while (!stop) {
    try {
      const {
        step = 50
      } = options;
      const key = 'AUTHORS_OFFSET';
      const offset = Number(await Cache.pGet(type, key)) || 0;
      const uri = `${config.atom.authorsUrl}?topic=${config.atom.topic}&offset=${offset}&limit=${step}`;
      const authors = await request({
        uri,
        json: true,
        timeout: 5000
      }).promise();
      const length = authors.length;
      for (const author of authors) {
        // Log.createAnonymity('同步作者', `${author.user_address} ${author.status}`);
        await Author.upsert(author.user_address, {
          status: author.status
        });
      }
      console.log(
        ` ------------- 当前请求返回的用户数量 ---------------`,
        length
      );
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
        console.log('所有作者同步完毕');
      } else {
        offsetIncrement = length;
      }
      const newOffset = offset + offsetIncrement;
      console.log(` ------------- newOffset ---------------`, newOffset);
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

const encodeAtom = (text = '') => {
  return text
    .replace(/<title>.*<\/title>/g, x => {
      return x.replace(/&/g, encodeURIComponent('&'));
    })
    .replace(/<name>.*<\/name>/g, x => {
      return x.replace(/&/g, encodeURIComponent('&'));
    });
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

const tryDecodeURIComponent = (text = '') => {
  try {
    return decodeURIComponent(text);
  } catch (err) {}
  return text;
};

const extractPost = async post => {
  const rId = post.id;
  const block = await getBlock(rId);
  const {
    title,
    avatar,
    content
  } = extractFrontMatter(post);
  const derivedPost = {
    rId,
    userAddress: block.user_address,
    title: tryDecodeURIComponent(title),
    content,
    paymentUrl: JSON.parse(block.meta).payment_url,
    pubDate: new Date(post.pubDate)
  };
  const author = {
    address: block.user_address,
    name: tryDecodeURIComponent(post.author),
    avatar
  };
  return {
    author,
    derivedPost
  };
};

const syncPosts = async (options = {}) => {
  console.log(` ------------- 同步文章 ---------------`);
  let stop = false;
  while (!stop) {
    try {
      const {
        step = 20
      } = options;
      const key = 'POSTS_OFFSET_1';
      const offset = Number(await Cache.pGet(type, key)) || 0;
      const uri = `${config.atom.postsUrl}?topic=${config.atom.topic}&offset=${offset}&limit=${step}`;
      const text = await request({
        uri,
        timeout: 10000
      }).promise();
      const safeText = encodeAtom(text);
      const parser = new Parser();
      const result = await parser.parseString(safeText);
      const items = result.items || [];
      if (items.length === 0) {
        stop = true;
        console.log('所有文章同步完毕');
        continue;
      }
      const derivedItems = await Promise.all(items.map(extractPost));
      for (const index of items.keys()) {
        const {
          author,
          derivedPost
        } = derivedItems[index];
        const insertedAuthor = await Author.getByAddress(author.address);
        if (!insertedAuthor) {
          continue;
        }
        await Author.upsert(author.address, {
          name: author.name,
          avatar: author.avatar
        });
        console.log(` ------------- 同步作者资料 author ---------------`, author);
        // Log.createAnonymity('同步作者资料', `${author.address} ${author.name}`)
        await Post.create(derivedPost);
        // Log.createAnonymity('同步文章', `${derivedPost.rId} ${derivedPost.title}`)
        const postExtra = await PostExtra.get(derivedPost.rId);
        if (postExtra) {
          const {
            rewardSummary,
            upVotesCount,
            commentsCount
          } = postExtra;
          await Post.update(derivedPost.rId, {
            rewardSummary: rewardSummary || '',
            upVotesCount: ~~upVotesCount,
            commentsCount: ~~commentsCount
          })
        }
      }
      const newOffset = offset + items.length;
      console.log(` ------------- newOffset ---------------`, newOffset);
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