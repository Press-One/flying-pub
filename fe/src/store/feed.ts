import fm from 'front-matter';
import removeMd from 'remove-markdown';
import moment from 'moment';

export interface Feed {
  description: string;
  feedUrl: string;
  generator: string;
  items: Post[];
  lastBuildDate: string;
  link: string;
  title: string;
}

export interface Post {
  attributes?: {
    author: string;
    avatar: string;
    title: string;
  };
  content: string;
  contentSnippet: string;
  guid?: string;
  id: string;
  isoDate: string;
  link: string;
  pubDate: string;
  author: string;
  title: string;
}

const getPagePosts = (posts: Post[], length: number) => {
  return posts.slice(0, length);
};

const getUniqueIds = (id: string, ids: any = []) => {
  const uniqueIds: any = ids.filter((_id: string) => {
    return _id !== id;
  });
  uniqueIds.unshift(id);
  return uniqueIds;
};

const extractFrontMatter = (post: Post): Post => {
  const fmContent: any = fm(post.content);
  const fmContentSnippet: any = fm(post.contentSnippet);
  post.attributes = fmContent.attributes;
  post.content = fmContent.body;
  post.contentSnippet = removeMd(fmContentSnippet.body);
  return post;
};

const decode = (post: Post): Post => {
  try {
    post.author = decodeURIComponent(post.author);
    post.title = decodeURIComponent(post.title);
  } catch (err) {}
  return post;
};

const format = (post: Post): Post => {
  post = extractFrontMatter(post);
  post = decode(post);
  return post;
};

const sortByPubDate = (ids: Post[], postMap: any) => {
  return ids.sort((id1: any, id2: any) => {
    return new Date(postMap[id2].pubDate).getTime() - new Date(postMap[id1].pubDate).getTime();
  });
};

const getHotPoint = (postExtra: any) => {
  if (!postExtra) {
    return 0;
  }
  const point = ~~postExtra.upVotesCount + ~~postExtra.commentsCount * 0.6;
  return point;
};

const sortByHotPoint = (ids: Post[], postExtraMap: any) => {
  return ids.sort((id1: any, id2: any) => {
    return getHotPoint(postExtraMap[id2]) - getHotPoint(postExtraMap[id1]);
  });
};

const filterPostsByDiffDays = (ids: [], postMap: any, diffDays: number) => {
  return ids.filter((id: string) => {
    return moment().diff(moment(postMap[id].pubDate), 'days') <= diffDays;
  });
};

interface FeedInfo {
  title: string;
  description: string;
}

const getFeedInfo = (): FeedInfo => {
  return {
    title: 'XUE.cn 自学编程',
    description: '学习是一种社交活动',
  };
};

const getPostsByIds = (ids: any = [], postMap: any) => {
  return ids.map((id: string) => getPostById(id, postMap));
};

const getPostById = (id: string, postMap: any) => postMap[id];

const findId = (ids: any = [], id: string) => {
  return ids.find((_id: string) => _id === id);
};

const filterIdsByAuthors = (ids: any = [], blockMap: any, authors: any = []) => {
  return ids.filter((id: string) => authors.includes(blockMap[id]));
};

export function createFeedStore() {
  let feed: Feed = {
    description: '',
    feedUrl: '',
    generator: '',
    items: [],
    lastBuildDate: '',
    link: '',
    title: '',
  };
  const postMap: any = {};
  let prePushedPost: any;
  const postExtraMap: any = {};
  const ids: any = [];
  let enabledHotSort = true;
  let cachedLastFilteredIds: any = [];
  const blockMap: any = {};
  const subAuthors: any = [];
  return {
    feed,
    ids,
    order: 'HOT',
    diffDays: 3,
    postMap,
    isFetchedFeed: false,
    isFetchedExtra: false,
    rssUrl: '',
    per: 10,
    page: 1,
    postId: '',
    prePushedPost,
    postExtraMap,
    isChangingOrder: false,
    blockMap,
    subAuthors,
    get authorMap() {
      const map: any = {};
      for (let rId in this.blockMap) {
        const address = this.blockMap[rId];
        const post = this.postMap[rId];
        if (post && !map[address]) {
          const { author, avatar } = post.attributes;
          map[address] = {
            name: author,
            avatar,
          };
        }
      }
      return map;
    },
    get posts(): Post[] {
      const sortedIds = sortByPubDate(this.ids, this.postMap);
      const posts = getPostsByIds(sortedIds, this.postMap);
      return posts;
    },
    get filteredIds() {
      let sortedIds = [];
      if (this.order === 'HOT') {
        const filteredIds: any =
          this.diffDays > 0
            ? filterPostsByDiffDays(this.ids, this.postMap, this.diffDays)
            : this.ids;
        sortedIds =
          enabledHotSort || cachedLastFilteredIds.length === 0
            ? sortByHotPoint(filteredIds, this.postExtraMap)
            : cachedLastFilteredIds;
        enabledHotSort = false;
      } else if (this.order === 'SUBSCRIPTION') {
        sortedIds = filterIdsByAuthors(this.ids, this.blockMap, this.subAuthors);
      } else {
        sortedIds = sortByPubDate(this.ids, this.postMap);
      }
      cachedLastFilteredIds = sortedIds;
      return sortedIds;
    },
    get pagePosts(): Post[] {
      const pageIds = getPagePosts(this.filteredIds, this.page * this.per);
      if (this.prePushedPost) {
        const prePushedPostId = this.prePushedPost.id;
        const uniqueIds = getUniqueIds(prePushedPostId, pageIds);
        const posts = getPostsByIds(uniqueIds, this.postMap);
        return posts;
      }
      const posts = getPostsByIds(pageIds, this.postMap);
      return posts;
    },
    get currentPost() {
      return getPostById(this.postId, this.postMap);
    },
    get hasMore() {
      return this.page * this.per < this.filteredIds.length;
    },
    get isFetched() {
      return this.isFetchedFeed && this.isFetchedExtra;
    },
    setRssUrl(rssUrl: string) {
      this.rssUrl = rssUrl;
    },
    loadMore() {
      if (this.page * this.per >= this.filteredIds.length) {
        return;
      }
      this.page = this.page + 1;
    },
    setPage(page: number) {
      this.page = page;
    },
    setPostId(postId: string) {
      this.postId = postId;
      const pageIds = getPagePosts(this.filteredIds, this.page * this.per);
      const id = findId(pageIds, this.postId);
      if (!id) {
        const prePushedPostId = findId(this.ids, this.postId);
        this.prePushedPost = getPostById(prePushedPostId, this.postMap);
      }
      return;
    },
    setIsFetchedFeed(status: boolean) {
      this.isFetchedFeed = status;
    },
    setFeed(feed: Feed) {
      feed.items = feed.items.map(format);
      for (const item of feed.items) {
        const post: any = item;
        this.postMap[post.id] = post;
        this.ids.push(post.id);
      }
      feed.title = getFeedInfo().title || feed.title;
      feed.description = getFeedInfo().description || feed.description;
      this.feed = feed;
    },
    setPostExtraMap(posts: any) {
      if (!this.isFetchedExtra) {
        enabledHotSort = true;
      }
      for (const post of posts) {
        this.postExtraMap[post.fileRId] = post;
      }
      this.isFetchedExtra = true;
    },
    updatePostExtraMap(fileRId: string, post: any) {
      this.postExtraMap[fileRId] = post;
    },
    setFilter(options: any = {}) {
      enabledHotSort = true;
      const { order, diffDays } = options;
      this.order = order;
      this.diffDays = diffDays;
      this.page = 1;
    },
    setIsChangingOrder(status: boolean) {
      this.isChangingOrder = status;
    },
    setBlockMap(blockMap: any) {
      this.blockMap = blockMap;
    },
    setAuthors(authors: any) {
      this.subAuthors = authors;
    },
  };
}
