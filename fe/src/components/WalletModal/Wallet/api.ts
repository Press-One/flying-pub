import request from '../../../request';
import qs from 'query-string';

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
  async getReceipts(options: any = {}) {
    const query = qs.stringify(options) ? `?${qs.stringify(options)}` : '';
    return request(`/api/finance/receipts${query}`);
  },
  async updatePin(payload: any) {
    return request('/api/finance/pin', {
      method: 'POST',
      body: {
        payload,
      },
    });
  },
  async validatePin(payload: any) {
    return request('/api/finance/pin/validate', {
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
