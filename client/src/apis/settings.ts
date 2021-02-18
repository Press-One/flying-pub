import request from '../request';

export default {
  fetchSettings() {
    return request('/api/settings');
  },
}