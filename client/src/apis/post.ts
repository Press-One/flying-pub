
import qs from 'query-string';
import request from '../request';

export type FilterType = 'SUBSCRIPTION' | 'POPULARITY' | 'PUB_DATE';

export interface IPostTopic {
  uuid: string;
  name: string;
  deleted: boolean;
}

export interface IPost {
  rId: string;
  title: string;
  content?: string;
  cover?: string;
  pubDate: string;
  rewardSummary: string;
  upVotesCount: number;
  commentsCount: number;
  latestRId: string | null;
  deleted: boolean;
  sticky: boolean;
  status: string;
  invisibility: boolean;
  topics: IPostTopic[];
  voted: boolean;
  author: {
    address: string;
    nickname: string;
    avatar: string;
  };
}

export default {
  fetchSubscription(options: any = {}) {
    return request(`/api/posts/subscription?${qs.stringify(options)}`, {
      minPendingDuration: 300
    });
  },
  fetchPosts(options: any = {}) {
    return request(`/api/posts?${qs.stringify(options)}`, {
      minPendingDuration: 300
    });
  },
  fetchPostsByUserSettings(options = {}) {
    return request(`/api/posts/by_user_settings?${qs.stringify(options)}`, {
      minPendingDuration: 300
    });
  },
  fetchPost(rId: string, options = {}) {
    return request(`/api/posts/${rId}?${qs.stringify(options)}`, {
      minPendingDuration: 300
    });
  },
  fetchPostTopics(rId: string, options = {}) {
    return request(`/api/posts/${rId}/topics?${qs.stringify(options)}`, {
      minPendingDuration: 300
    });
  },
};
