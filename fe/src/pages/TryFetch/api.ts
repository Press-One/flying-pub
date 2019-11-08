import Parser from 'rss-parser';
import request from '../../request';

export default {
  async fetchUser() {
    return request('/api/user');
  },
  async fetchFeed(rssUrl: string) {
    const res = await fetch(rssUrl, {
      credentials: 'include',
    });
    console.log(` ------------- res.status ---------------`, res.status);
    if (res.status !== 200) {
      throw Object.assign(new Error(), {
        status: res.status,
      });
    }
    const text = await res.text();
    const parser = new Parser();
    const result = await parser.parseString(text);
    return result;
  },
};
