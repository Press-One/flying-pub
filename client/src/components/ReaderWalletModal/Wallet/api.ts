import request from '../../../request';

export default {
  async getBalance() {
    return request('/api/finance/reader_balance');
  },
  async withdraw(payload: any) {
    return request('/api/finance/reader_withdraw', {
      method: 'POST',
      body: {
        payload,
      },
    });
  },
};
