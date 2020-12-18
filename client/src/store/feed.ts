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
    filterDayRange: 7,
    subscriptionType: 'author',
    latestType: 'PUB_DATE',
    limit: 15,
    pending: false,
    hasMore: false,
    total: 0,
    page: 0,
    isFetching: false,
    isFetched: false,
    isNew: true,
    willLoadingPage: false,
    pendingNewPage: false,
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
      for (const post of posts) {
        if (!this.rIdsSet.has(post.rId)) {
          this.postMap[post.rId] = post;
          this.rIdsSet.add(post.rId);
        }
      }
      if (this.filterType === 'SUBSCRIPTION') {
        this.hasMorePosts = this.length < this.total;
      } else {
        this.hasMorePosts = posts.length === this.limit;
      }
    },
    setPost(post: IPost) {
      this.postMap[post.rId] = post;
      this.postRId = post.rId;
    },
    clearPost() {
      this.postRId = '';
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
      const { type, dayRange, subscriptionType, latestType } = options;
      this.filterType = type;
      if (dayRange || dayRange === 0) {
        this.filterDayRange = dayRange;
      }
      if (latestType) {
        this.latestType = latestType;
      }
      if (subscriptionType) {
        this.subscriptionType = subscriptionType;
      }
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
    },
    setPendingNewPage(status: boolean) {
      this.pendingNewPage = status;
    }
  };
}
