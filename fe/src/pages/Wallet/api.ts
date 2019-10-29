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
  async getReceipts() {
    return request('/api/finance/receipts');
  },
  async updatePin(payload: any) {
    return request('/api/finance/pin', {
      method: 'POST',
      body: {
        payload,
      },
    });
  },
  async isCustomPinExist() {
    return request('/api/finance/pin/exist');
  },
};
