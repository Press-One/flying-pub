import request from '../request';

export default {
  importArticle(url: string) {
    return request(`/api/import/?url=${encodeURIComponent(url)}`, {
      method: 'POST',
    });
  },
}