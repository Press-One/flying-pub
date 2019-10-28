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
  async withdraw(payload: any) {
    return request('/api/finance/withdraw', {
      method: 'POST',
      body: {
        payload,
      },
    });
  },
};
