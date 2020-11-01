import { IPost } from 'apis/post';
import { IAuthor } from 'apis/author';
import { ITopic } from 'apis/topic';

export function createFeedStore() {
  const postMap: any = {};
  const rIdsSet = new Set();
  const stickyRIdsSet = new Set();
  return {
    provider: '',
    postRId: '',
    rIdsSet,
    stickyRIdsSet,
    postMap,
    filterType: '' as string,
    filterDayRange: 3,
    limit: 15,
    pending: false,
    hasMore: false,
    total: 0,
    page: 0,
    isFetching: false,
    isFetched: false,
    isNew: true,
    willLoadingPage: false,
    belongedAuthor: ({} as IAuthor),
    belongedTopic: ({} as ITopic),
    hasMorePosts: false,
    syncedFromSettings: false,
    get hasPosts() {
      return this.posts.length > 0;
    },
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
    get posts(): IPost[] {
      return this.rIds.map((rId: string) => this.postMap[rId]);
    },
    get stickyRIds(): any {
      return Array.from(this.stickyRIdsSet);
    },
    get stickyPosts(): IPost[] {
      return this.stickyRIds.map((rId: string) => this.postMap[rId]);
    },
    addStickyPosts(posts: IPost[]) {
      for (const post of posts) {
        if (!this.stickyRIdsSet.has(post.rId)) {
          this.postMap[post.rId] = post;
          this.stickyRIdsSet.add(post.rId);
        }
      }
    },
    setIsFetching(status: boolean) {
      this.isFetching = status;
      if (!status) {
        this.willLoadingPage = false;
      }
    },
    setIsFetched(status: boolean) {
      this.isFetched = status;
    },
    setPage(page: number) {
      if (page === 0) {
        this.rIdsSet.clear();
      }
      this.willLoadingPage = true;
      this.page = page;
    },
    setTotal(total: number) {
      this.total = total;
    },
    addPosts(posts: IPost[]) {
      this.isNew = false;
      this.hasMorePosts = posts.length === this.limit;
      for (const post of posts) {
        if (!this.rIdsSet.has(post.rId)) {
          this.postMap[post.rId] = post;
          this.rIdsSet.add(post.rId);
        }
      }
    },
    setPost(post: IPost) {
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
    setFilterType(type: string) {
      this.filterType = type;
    },
    setFilter(options: any = {}) {
      const { type, dayRange } = options;
      this.filterType = type;
      this.filterDayRange = dayRange;
    },
    emptyPosts() {
      this.rIdsSet.clear();
      this.hasMorePosts = false;
    },
    clear() {
      this.rIdsSet.clear();
      this.belongedAuthor = {} as IAuthor;
      this.belongedTopic = {} as ITopic;
      this.isNew = true;
      this.isFetched = false;
      this.page = 0;
      this.total = 0;
      this.hasMore = false;
      this.willLoadingPage = false;
      this.filterType = '';
    },
    setProvider(provider: string) {
      this.provider = provider;
    },
    setBelongedAuthor(author: IAuthor) {
      this.belongedAuthor = author
    },
    setBelongedTopic(Topic: ITopic) {
      this.belongedTopic = Topic
    },
    markSyncedFromSettings() {
      this.syncedFromSettings = true;
    }
  };
}
