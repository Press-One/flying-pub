import request from '../../request';

export default {
  fetchSubscription(address: string) {
    return request(`/api/subscriptions/${address}`);
  },
  subscribe(payload: any) {
    return request(`/api/subscriptions`, {
      method: 'POST',
      body: {
        payload,
      },
    });
  },
  unsubscribe(address: string) {
    return request(`/api/subscriptions/${address}`, {
      method: 'DELETE',
    });
  },
};
