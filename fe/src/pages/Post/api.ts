import request from '../../request';

export default {
  async reward(fileRId: string, payload: any, options: any = {}) {
    const { method } = options;
    return request(`/api/finance/reward/${fileRId}?method=${method}`, {
      method: 'POST',
      body: {
        payload,
      },
    });
  },
  async getReward(fileRId: string) {
    return request(`/api/finance/reward/${fileRId}`);
  },
  async validatePin(payload: any) {
    return request('/api/finance/pin/validate', {
      method: 'POST',
      body: {
        payload,
      },
    });
  },
};
