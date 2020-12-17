import Parser from 'rss-parser';
import qs from 'query-string';
import request from './request';

export interface TopicPermissionResult {
  count: number;
  users: Array<{
    address: string;
    nickname: string;
    avatar: string;
  }>;
}

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
  updateUser(payload: any) {
    return request('/api/user', {
      method: 'PUT',
      body: payload,
    });
  },
  fetchProfiles() {
    return request('/api/profile');
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
  fetchSubscriptions() {
    return request(`/api/subscriptions/follower`);
  },
  fetchSubscription(address: string) {
    return request(`/api/subscriptions/following/${address}`);
  },
  subscribe(address: string) {
    return request(`/api/subscriptions/following`, {
      method: 'POST',
      body: {
        payload: {
          address,
        },
      },
    });
  },
  unsubscribe(address: string) {
    return request(`/api/subscriptions/following/${address}`, {
      method: 'DELETE',
    });
  },
  tryInitPubUser(pubUrl: string) {
    return request('/api/user', {
      base: pubUrl,
      credentials: 'include',
    });
  },
  getPhoneCode(phone: string) {
    return request('/api/auth/phone/send_code', {
      method: 'POST',
      body: {
        phone,
      },
    });
  },
  verifyPhoneCode(phone: string, code: string) {
    return request('/api/auth/phone/verify_code', {
      method: 'POST',
      body: {
        phone,
        code,
      },
    });
  },
  phonePasswordLogin(phone: string, password: string) {
    return request('/api/auth/phone/password/login', {
      method: 'POST',
      body: {
        phone,
        password,
      },
    });
  },
  phoneBind(phone: string, code: string) {
    return request('/api/auth/phone/bind', {
      method: 'POST',
      body: {
        phone,
        code,
      },
    });
  },
  setPassword(
    params: { phone: string; password: string } & ({ code: string } | { oldPassword: string }),
  ) {
    return request('/api/user/password', {
      method: 'PUT',
      body: params,
    });
  },
  uploadImage(formData: any) {
    return fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
  },
  fetchTopicAllowedUsers(p: { offset: number; limit: number }) {
    return request(`/api/block_topics/allow?${qs.stringify(p)}`) as Promise<TopicPermissionResult>;
  },
  fetchTopicDeniedUsers(p: { offset: number; limit: number }) {
    return request(`/api/block_topics/deny?${qs.stringify(p)}`) as Promise<TopicPermissionResult>;
  },
  allowTopicUser(userAddress: string) {
    return request(`/api/block_topics/allow/${userAddress}`, { method: 'POST' });
  },
  denyTopicUser(userAddress: string) {
    return request(`/api/block_topics/deny/${userAddress}`, { method: 'POST' });
  },
  getXuePhoneCode(phone: string) {
    return request('/api/auth/xuecn/send_code', {
      method: 'POST',
      body: {
        phone,
      },
    });
  },
  verifyXuePhoneCode(phone: string, code: string) {
    return request('/api/auth/xuecn/verify', {
      method: 'POST',
      body: {
        phone,
        code,
      },
    });
  },
  getBannedReaderPosts() {
    return request(`/api/posts?filterBan=true`);
  },
  getReaderPost(rId: string) {
    return request(`/api/posts/${rId}`);
  },
  denyReaderPost(rId: string) {
    return request(`/api/posts/${rId}`, { method: 'PUT', body: { payload: { deleted: true } } });
  },
  allowReaderPost(rId: string) {
    return request(`/api/posts/${rId}`, { method: 'PUT', body: { payload: { deleted: false } } });
  },
  getStickyReaderPosts() {
    return request(`/api/posts?filterSticky=true`);
  },
  stickyReaderPost(rId: string) {
    return request(`/api/posts/${rId}`, { method: 'PUT', body: { payload: { sticky: true } } });
  },
  unstickyReaderPost(rId: string) {
    return request(`/api/posts/${rId}`, {
      method: 'PUT',
      body: { payload: { sticky: false } },
    });
  },
  searchableReaderPost(uri: string) {
    return request(`/api/search`, { method: 'POST', body: { uri } });
  },
  unsearchableReaderPost(uri: string) {
    return request(`/api/search`, { method: 'DELETE', body: { uri } });
  },
};
