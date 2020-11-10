import request from '../request';
import IUser from 'types/user'
import qs from 'query-string';

export interface IEditableTopic {
  cover: string;
  name: string;
  description: string;
  contributionEnabled: boolean;
  reviewEnabled: boolean;
}

export interface ITopic {
  uuid: string;
  cover: string;
  name: string;
  description: string;
  contributionEnabled: boolean;
  reviewEnabled: boolean;
  deleted?: boolean;
  following?: boolean;
  user?: IUser;
  summary: {
    follower: {
      count: number;
      preview: string[]
    },
    author?: {
      count: number;
      preview: string[]
    },
    post: {
      count: number;
    }
  },
}

export default {
  get(uuid: string) {
    return request(`/api/topics/${uuid}`, {
      method: 'GET',
      minPendingDuration: 200
    });
  },
  fetchTopicsByUserAddress(userAddress: string, options = {}) {
    return request(`/api/topics/user/${userAddress}?${qs.stringify(options)}`, {
      method: 'GET',
      minPendingDuration: 300
    });
  },
  fetchFollowingTopicsByUserAddress(userAddress: string, options = {}) {
    return request(`/api/topics/user/${userAddress}/following?${qs.stringify(options)}`, {
      method: 'GET',
      minPendingDuration: 300
    });
  },
  create(data: IEditableTopic) {
    return request(`/api/topics`, {
      method: 'POST',
      body: {
        payload: data,
      },
      minPendingDuration: 500
    });
  },
  update(uuid: string, data: IEditableTopic) {
    return request(`/api/topics/${uuid}`, {
      method: 'PUT',
      body: {
        payload: data,
      },
      minPendingDuration: 500
    });
  },
  delete(uuid: string) {
    return request(`/api/topics/${uuid}`, {
      method: 'DELETE',
      minPendingDuration: 500
    });
  },
  addContribution(uuid: string, rId: string) {
    return request(`/api/topics/${uuid}/contributions`, {
      method: 'POST',
      body: {
        payload: { rId },
      }
    });
  },
  removeContribution(uuid: string, rId: string, note?: string) {
    return request(`/api/topics/${uuid}/contributions`, {
      body: {
        payload: { rId, note },
      },
      method: 'DELETE',
      minPendingDuration: 500
    });
  },
  addContributionRequest(uuid: string, rId: string) {
    return request(`/api/topics/${uuid}/contribution_requests`, {
      method: 'POST',
      body: {
        payload: { rId },
      }
    });
  },
  removeContributionRequest(uuid: string, rId: string) {
    return request(`/api/topics/${uuid}/contribution_requests`, {
      body: {
        payload: { rId },
      },
      method: 'DELETE'
    });
  },
  subscribe(uuid: string) {
    return request(`/api/topics/${uuid}/followers`, {
      method: 'POST',
    });
  },
  unsubscribe(uuid: string) {
    return request(`/api/topics/${uuid}/followers`, {
      method: 'DELETE',
    });
  },
  fetchTopicAuthors(uuid: string, options = {}) {
    return request(`/api/topics/${uuid}/authors?${qs.stringify(options)}`, {
      method: 'GET',
      minPendingDuration: 300
    });
  },
  fetchFollowers(uuid: string, options = {}) {
    return request(`/api/topics/${uuid}/followers?${qs.stringify(options)}`, {
      method: 'GET',
      minPendingDuration: 300
    });
  },
  fetchTopicPosts(uuid: string, options = {}) {
    return request(`/api/topics/${uuid}/posts?${qs.stringify(options)}`, {
      method: 'GET',
      minPendingDuration: 300
    });
  },
  fetchPublicTopics(options = {}) {
    return request(`/api/topics/public?${qs.stringify(options)}`, {
      method: 'GET',
      minPendingDuration: 300
    });
  },
};
