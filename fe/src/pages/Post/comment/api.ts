import request from '../../../request';
import { stringify } from 'query-string';

export default {
  create(comment: any) {
    const path = '/api/comments';
    return request(path, {
      method: 'POST',
      body: {
        payload: comment,
      },
    });
  },
  get(id: number) {
    const path = `/api/comments/${id}`;
    return request(path);
  },
  list(fileRId: number, pagination: any = null) {
    let query = '';
    if (pagination) {
      query = `?${stringify({ fileRId, ...pagination })}`;
    }
    const path = `/api/comments${query}`;
    return request(path);
  },
  delete(id: number) {
    const path = `/api/comments/${id}`;
    return request(path, {
      method: 'DELETE',
    });
  },
};
