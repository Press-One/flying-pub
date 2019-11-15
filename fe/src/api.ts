import Parser from 'rss-parser';
import request from './request';

export default {
  async setAutoLoginUrl(url: string) {
    return request(`/api/auto_login`, {
      method: 'POST',
      body: {
        payload: {
          url,
        },
      },
    });
  },
  async getAutoLoginUrl() {
    return request(`/api/auto_login`);
  },
  async deleteAutoLoginUrl() {
    return request(`/api/auto_login`, {
      method: 'DELETE',
    });
  },
  async fetchUser() {
    return request('/api/user');
  },
  async fetchFeed(rssUrl: string) {
    const res = await fetch(rssUrl, {
      credentials: 'include',
    });
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
  async fetchPosts() {
    return request('/api/posts');
  },
};
