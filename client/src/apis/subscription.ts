import request from '../request';
import qs from 'query-string';

export default {
  fetchFollowers(userAddress: string, options = {}) {
    return request(`/api/subscriptions/${userAddress}/followers?${qs.stringify(options)}`, {
      minPendingDuration: 300
    });
  },
  fetchFollowing(userAddress: string, options = {}) {
    return request(`/api/subscriptions/${userAddress}/following?${qs.stringify(options)}`, {
      minPendingDuration: 300
    });
  },
  subscribe(userAddress: string) {
    return request(`/api/subscriptions/${userAddress}`, {
      method: 'POST',
    });
  },
  unsubscribe(userAddress: string) {
    return request(`/api/subscriptions/${userAddress}`, {
      method: 'DELETE',
    });
  },
};
