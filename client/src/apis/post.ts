
import qs from 'query-string';
import request from '../request';

export type FilterType = 'SUBSCRIPTION' | 'POPULARITY' | 'LATEST';

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
  viewCount: number;
  latestRId: string | null;
  deleted: boolean;
  sticky: boolean;
  status: string;
  invisibility: boolean;
  topics: IPostTopic[];
  pendingTopicUuids?: string[];
  voted: boolean;
  fileId: number;
  favorite: boolean;
  author: {
    address: string;
    nickname: string;
    avatar: string;
  };
}

export default {
  fetchPosts(options: any = {}) {
    return request(`/api/posts?${qs.stringify(options)}`, {
      minPendingDuration: 300
    });
  },
  fetchPostsBySubscription(options: any = {}) {
    return request(`/api/posts/subscription?${qs.stringify(options)}`, {
      minPendingDuration: 300
    });
  },
  fetchPostsByPopularity(options: any = {}) {
    return request(`/api/posts/popularity?${qs.stringify(options)}`, {
      minPendingDuration: 300
    });
  },
  fetchPostsByLatestComment(options: any = {}) {
    return request(`/api/posts/latest_comment?${qs.stringify(options)}`, {
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
  fetchFavorites(options = {}) {
    return request(`/api/posts/favorite?${qs.stringify(options)}`, {
      minPendingDuration: 300
    });
  },
  favorite(rId: string) {
    return request(`/api/posts/${rId}/favorite`, {
      method: 'POST'
    });
  },
  unfavorite(rId: string) {
    return request(`/api/posts/${rId}/unfavorite`, {
      method: 'POST'
    });
  },
};
