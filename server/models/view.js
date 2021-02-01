const config = require('../config');
const Cache = require('../models/cache');
const Post = require('../models/post');
const {
  assert,
  Errors,
} = require('../utils/validator');

const TYPE = 'VIEW';
const IP_EXPIRED_DURATION = config.postView && config.postView.ipExpiredDuration > 0 ? config.postView.ipExpiredDuration : 60 * 60;

const getCountKey = postRId => `count:${postRId}`;

exports.getCountByRId = async postRId => {
  const countKey = getCountKey(postRId);
  const count = await Cache.pGet(TYPE, countKey);
  return count ? ~~count : 0;
}

const trySave = async (ip, postRId, postViewCount = 0) => {
  try {
    assert(ip, Errors.ERR_IS_REQUIRED('ip'));
    assert(postRId, Errors.ERR_IS_REQUIRED('postRId'));
    const ipKey = `view:${postRId}:${ip}`
    const countKey = getCountKey(postRId);
    const existOne = await Cache.pGet(TYPE, ipKey);
    let cachedCount = await Cache.pGet(TYPE, countKey) || 0;
    cachedCount = ~~cachedCount || postViewCount;
    if (!existOne) {
      await Cache.pSetWithExpired(TYPE, ipKey, '1', IP_EXPIRED_DURATION, true);
      cachedCount++;
      await Cache.pSet(TYPE, countKey, `${cachedCount}`);
    }
    return cachedCount;
  } catch (err) {
    console.log(err);
  }
}
exports.trySave = trySave;

exports.sync = async () => {
  try {
    const keys = await Cache.pFindKeys(TYPE, `count:*`);
    for (const key of keys) {
      const countKey = key.replace(Cache.getPrefix() + TYPE + '_', '');
      let count = await Cache.pGet(TYPE, countKey);
      count = ~~count;
      if (count > 0) {
        const postRId = countKey.split(':')[1];
        const post = await Post.SequelizePost.findOne({
          attributes: ['viewCount'],
          where: {
            rId: postRId
          },
          raw: true
        });
        if (!post) {
          await Cache.pDel(TYPE, countKey);
          continue;
        }
        if (~~post.viewCount < count) {
          await Post.updateByRId(postRId, {
            viewCount: count
          });
        }
        await Cache.pDel(TYPE, countKey);
      }
    }
  } catch (err) {
    console.log(err);
  }
}
