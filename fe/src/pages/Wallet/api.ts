import request from '../../request';

export default {
  async getBalance() {
    return request('/api/finance/balance');
  },
  async recharge(payload: any) {
    return request('/api/finance/recharge', {
      method: 'POST',
      body: {
        payload,
      },
    });
  },
};
