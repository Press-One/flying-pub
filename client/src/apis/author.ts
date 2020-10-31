import request from '../request';
import qs from 'query-string';

export interface IAuthor {
  address: string;
  avatar: string;
  cover: string;
  nickname: string;
  bio?: string;
  following?: boolean;
  summary?: {
    followingAuthor: {
      count: number;
      preview: string[];
    },
    follower: {
      count: number;
      preview: string[];
    },
    topic: {
      count: number;
      preview: string[];
    },
    followingTopic: {
      count: number;
      preview: string[];
    },
    post: {
      count: number;
    }
  }
};

export default {
  fetchAuthor(address: string, options: any = {}) {
    return request(`/api/authors/${address}?${qs.stringify(options)}`, {
      minPendingDuration: 200
    });
  },
  fetchRecommendedAuthors(options: any = {}) {
    return request(`/api/authors/recommended?${qs.stringify(options)}`, {
      minPendingDuration: 300
    });
  },
};
