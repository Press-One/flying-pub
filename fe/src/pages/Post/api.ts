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
  async rechargeThenReward(fileRId: string, payload: any) {
    return request(`/api/finance/recharge_then_reward/${fileRId}`, {
      method: 'POST',
      body: {
        payload,
      },
    });
  },
  async getRewardSummary(fileRId: string) {
    return request(`/api/finance/reward/${fileRId}`);
  },
  async getBlock(rId: string) {
    return request(`/api/v2/blocks/${rId}`, {
      base: 'https://press.one',
    });
  },
};
