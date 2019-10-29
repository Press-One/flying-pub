import request from '../../request';

export default {
  async validatePin(payload: any) {
    return request('/api/finance/pin/validate', {
      method: 'POST',
      body: {
        payload,
      },
    });
  },
};
