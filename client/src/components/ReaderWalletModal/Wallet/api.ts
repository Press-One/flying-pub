import request from '../../../request';
import qs from 'query-string';

export default {
  async getBalance() {
    return request('/api/reader_finance/balance');
  },
  async withdraw(payload: any) {
    return request('/api/reader_finance/withdraw', {
      method: 'POST',
      body: {
        payload,
      },
    });
  },
  async getReceipts(options: any = {}) {
    const query = qs.stringify(options) ? `?${qs.stringify(options)}` : '';
    return request(`/api/reader_finance/receipts${query}`);
  },
  async updatePin(payload: any) {
    return request('/api/reader_finance/pin', {
      method: 'POST',
      body: {
        payload,
      },
    });
  },
  async validatePin(payload: any) {
    return request('/api/reader_finance/pin/validate', {
      method: 'POST',
      body: {
        payload,
      },
    });
  },
  async isCustomPinExist() {
    return request('/api/reader_finance/pin/exist');
  },
};
