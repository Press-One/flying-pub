import request from '../../request';

export default {
  async recharge(payload: any) {
    return request('/api/finance/recharge', {
      method: 'POST',
      body: {
        payload,
      },
    });
  },
};
