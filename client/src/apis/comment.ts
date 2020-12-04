import request from '../request';
import { stringify } from 'query-string';

export default {
  create(comment: any) {
    const path = '/api/comments';
    return request(path, {
      method: 'POST',
      body: {
        payload: comment,
      },
      minPendingDuration: 500
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
      minPendingDuration: 500
    });
  },
  stick(id: number) {
    const path = `/api/comments/${id}/stick`;
    return request(path, {
      method: 'POST',
      minPendingDuration: 500
    });
  },
  unstick(id: number) {
    const path = `/api/comments/${id}/unstick`;
    return request(path, {
      method: 'POST',
      minPendingDuration: 500
    });
  },
  batchCommentIds(ids: string[]) {
    const path = `/api/comments/batch?ids=${ids.join(',')}`;
    return request(path, {
      method: 'GET'
    });
  },
};
