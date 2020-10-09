export default {
  getApi: () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    return isDevelopment ? 'http://localhost:8000' : window.location.origin;
  },
  getNotificationUrl: () => {
    const host = window.location.host;
    return host === 'xue.cn' ? 'https://push.xue.cn' : 'https://message.prsdev.club';
  },
  getTokenUrl: () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    return isDevelopment ? 'https://dev-pub.prsdev.club/api/token' : '/api/token';
  },
};
