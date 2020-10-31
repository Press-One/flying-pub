import request from '../request';

export default {
  checkPermission() {
    return request('/api/auth/permission');
  },
}