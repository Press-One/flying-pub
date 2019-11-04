import request from '../../request';

export default {
  async reward(fileRId: string, payload: any) {
    return request(`/api/finance/reward/${fileRId}`, {
      method: 'POST',
      body: {
        payload,
      },
    });
  },
  async getRewardSummary(fileRId: string) {
    return request(`/api/finance/reward/${fileRId}`);
  },
};
