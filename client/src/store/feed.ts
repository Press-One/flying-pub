export interface Post {
  rId: string;
  author: {
    address: string;
    name: string;
    avatar: string;
  };
  title: string;
  content?: string;
  paymentUrl?: string;
  pubDate: string;
  rewardSummary: string;
  upVotesCount: number;
  commentsCount: number;
  voted: boolean;
  latestRId?: string;
}

export function createFeedStore() {
  const postMap: any = {};
  const rIdsSet = new Set();
  const stickyRIdsSet = new Set();
  return {
    isFetched: false,
    postRId: '',
    rIdsSet,
    stickyRIdsSet,
    postMap,
    filterType: '',
    filterDayRange: 3,
    limit: 10,
    pending: false,
    hasMore: false,
    get post() {
      return this.postMap[this.postRId];
    },
    get optionsForFetching() {
      if (this.filterType === 'SUBSCRIPTION') {
        return {};
      }
      const options: any = { order: this.filterType };
      if (this.filterType === 'POPULARITY' && this.filterDayRange > 0) {
        options.dayRange = this.filterDayRange;
      }
      return options;
    },
    get stickyEnabled() {
      return this.filterType !== 'SUBSCRIPTION';
    },
    get length() {
      return this.posts.length;
    },
    get rIds(): any {
      return Array.from(this.rIdsSet);
    },
    get posts(): Post[] {
      return this.rIds.map((rId: string) => this.postMap[rId]);
    },
    get stickyRIds(): any {
      return Array.from(this.stickyRIdsSet);
    },
    get stickyPosts(): Post[] {
      return this.stickyRIds.map((rId: string) => this.postMap[rId]);
    },
    addStickyPosts(posts: Post[]) {
      for (const post of posts) {
        if (!this.stickyRIdsSet.has(post.rId)) {
          this.postMap[post.rId] = post;
          this.stickyRIdsSet.add(post.rId);
        }
      }
    },
    addPosts(posts: Post[]) {
      for (const post of posts) {
        if (!this.rIdsSet.has(post.rId)) {
          this.postMap[post.rId] = post;
          this.rIdsSet.add(post.rId);
        }
      }
      this.hasMore = posts.length === this.limit;
      this.isFetched = true;
    },
    setPost(post: Post) {
      this.postMap[post.rId] = post;
      this.postRId = post.rId;
    },
    updatePost(rId: string, data: any) {
      for (let key in data) {
        this.postMap[rId][key] = data[key];
      }
    },
    setPending(status: boolean) {
      this.pending = status;
    },
    setFilter(options: any = {}) {
      const { type, dayRange } = options;
      this.filterType = type;
      this.filterDayRange = dayRange;
      this.rIdsSet.clear();
    },
  };
}
