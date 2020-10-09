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

  checkPermission() {
    return request('/api/auth/permission');
  },
  getFiles(p: { offset: number; limit: number }) {
    return request(`/api/files?${qs.stringify(p)}`);
  },
  createDraft(file: any) {
    const path = '/api/files?type=DRAFT';
    file.mimeType = file.mimeType || 'text/markdown';
    const payload = { payload: file };
    return request(path, {
      method: 'POST',
      body: payload,
    });
  },
  createFile(file: any) {
    const path = '/api/files';
    file.mimeType = file.mimeType || 'text/markdown';
    const payload = { payload: file, origin: window.location.origin };
    return request(path, {
      method: 'POST',
      body: payload,
    });
  },
  getFile(id: any) {
    return request(`/api/files/${id}`);
  },
  updateFile(id: number | undefined, file: any, publish?: boolean) {
    const path = publish ? `/api/files/${id}?action=PUBLISH` : `/api/files/${id}`;
    file.mimeType = file.mimeType || 'text/markdown';
    const payload = { payload: file, origin: window.location.origin };
    return request(path, {
      method: 'PUT',
      body: payload,
    });
  },
  deleteFile(id: any) {
    return request(`/api/files/${id}`, {
      method: 'DELETE',
    });
  },
  hideFile(id: number | undefined) {
    return request(`/api/files/hide/${id}`, {
      method: 'PUT',
    });
  },
  showFile(id: number | undefined) {
    return request(`/api/files/show/${id}`, {
      method: 'PUT',
    });
  },
  importArticle(url: string) {
    return request(`/api/import/?url=${encodeURIComponent(url)}`, {
      method: 'POST',
    });
  },
  fetchTopicAllowedUsers(p: { offset: number; limit: number }) {
    return request(`/api/topics/allow?${qs.stringify(p)}`) as Promise<TopicPermissionResult>;
  },
  fetchTopicDeniedUsers(p: { offset: number; limit: number }) {
    return request(`/api/topics/deny?${qs.stringify(p)}`) as Promise<TopicPermissionResult>;
  },
  allowTopicUser(userAddress: string) {
    return request(`/api/topics/allow/${userAddress}`, { method: 'POST' });
  },
  denyTopicUser(userAddress: string) {
    return request(`/api/topics/deny/${userAddress}`, { method: 'POST' });
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
};
