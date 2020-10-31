import request from '../request';

export default {
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
}