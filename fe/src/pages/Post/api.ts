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
  async getBlocks(rId: string) {
    const { REACT_APP_PRESS_ONE_API_END_POINT } = process.env;
    return request(`/api/v2/blocks/${rId}`, {
      base: REACT_APP_PRESS_ONE_API_END_POINT,
    });
  },
};
