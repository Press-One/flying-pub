import Parser from 'rss-parser';
import qs from 'query-string';
import request from './request';

export default {
  setAutoLoginUrl(url: string) {
    return request(`/api/auto_login`, {
      method: 'POST',
      body: {
        payload: {
          url,
        },
      },
    });
  },
  getAutoLoginUrl() {
    return request(`/api/auto_login`);
  },
  deleteAutoLoginUrl() {
    return request(`/api/auto_login`, {
      method: 'DELETE',
    });
  },
  fetchUser() {
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
    const safeText = text
      .replace(/<title>.*<\/title>/g, (x) => {
        return x.replace(/&/g, encodeURIComponent('&'));
      })
      .replace(/<name>.*<\/name>/g, (x) => {
        return x.replace(/&/g, encodeURIComponent('&'));
      });
    try {
      const parser = new Parser();
      await parser.parseString(safeText);
    } catch (err) {
      console.log(err);
    }
    const parser = new Parser();
    const result = await parser.parseString(safeText);
    return result;
  },
  fetchPosts(type: string, options: any = {}) {
    const path = type === 'SUBSCRIPTION' ? '/api/posts/subscription' : '/api/posts';
    return request(`${path}?${qs.stringify(options)}`);
  },
  fetchPost(rId: string) {
    return request(`/api/posts/${rId}`);
  },
  createVote(vote: any) {
    const path = '/api/votes';
    return request(path, {
      method: 'POST',
      body: {
        payload: vote,
      },
    });
  },
  deleteVote(vote: any) {
    const path = `/api/votes`;
    return request(path, {
      method: 'DELETE',
      body: {
        payload: vote,
      },
    });
  },
  fetchSettings() {
    return request('/api/settings');
  },
  saveSettings(settings: any) {
    const path = `/api/settings`;
    return request(path, {
      method: 'PUT',
      body: {
        payload: settings,
      },
    });
  },
  fetchSubscriptions() {
    return request(`/api/subscriptions`);
  },
  fetchAuthor(address: string) {
    return request(`/api/authors/${address}`);
  },
  fetchSubscription(address: string) {
    return request(`/api/subscriptions/${address}`);
  },
  subscribe(address: string) {
    return request(`/api/subscriptions`, {
      method: 'POST',
      body: {
        payload: {
          address,
        },
      },
    });
  },
  unsubscribe(address: string) {
    return request(`/api/subscriptions/${address}`, {
      method: 'DELETE',
    });
  },
  tryInitPubUser(pubUrl: string) {
    return request('/api/user', {
      base: pubUrl,
      credentials: 'include',
    });
  },
};
