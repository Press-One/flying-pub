import fm from 'front-matter';
import removeMd from 'remove-markdown';

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
  id?: string;
  isoDate: string;
  link: string;
  pubDate: string;
  title: string;
}

export const getPostId = (post: Post): string => {
  return post.guid || post.id || '';
};

const findByPostId = (postId: string) => {
  return (post: Post) => {
    return getPostId(post) === postId;
  };
};

const getPagePosts = (posts: Post[], length: number) => {
  return posts.slice(0, length);
};

const getUniquePosts = (aPost: Post, posts: Post[]) => {
  const filteredPosts: Post[] = posts.filter((post: Post) => {
    return getPostId(post) !== getPostId(aPost);
  });
  filteredPosts.unshift(aPost);
  return filteredPosts;
};

const extractFrontMatter = (post: Post): Post => {
  const fmContent: any = fm(post.content);
  const fmContentSnippet: any = fm(post.contentSnippet);
  post.attributes = fmContent.attributes;
  post.content = fmContent.body;
  post.contentSnippet = removeMd(fmContentSnippet.body);
  return post;
};

const sortByPubDate = (posts: Post[]) => {
  return posts.sort((p1: any, p2: any) => {
    return new Date(p2.pubDate).getTime() - new Date(p1.pubDate).getTime();
  });
};

interface FeedInfo {
  title: string;
  description: string;
}

const getFeedInfo = (): FeedInfo => {
  return {
    title: 'XUE.cn 自学编程',
    description: '学习是一种社交行为',
  };
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
  return {
    feed,
    postMap,
    isFetched: false,
    rssUrl: '',
    per: 10,
    page: 1,
    postId: '',
    prePushedPost,
    postExtraMap,
    get pagePosts(): Post[] {
      const posts = getPagePosts(this.feed.items, this.page * this.per);
      if (this.prePushedPost) {
        return getUniquePosts(this.prePushedPost, posts);
      }
      return posts;
    },
    get currentPost() {
      const post: Post | undefined = this.feed.items.find((item: Post) => {
        return getPostId(item) === this.postId;
      });
      return post;
    },
    get hasMore() {
      return this.page * this.per < this.feed.items.length;
    },
    setIsFetched(status: boolean) {
      this.isFetched = status;
    },
    setFeed(feed: Feed) {
      feed.items = feed.items.map(extractFrontMatter);
      for (const item of feed.items) {
        const post: any = item;
        this.postMap[post.id] = item;
      }
      const sortedFiles = sortByPubDate(feed.items);
      feed.items = sortedFiles;
      feed.title = getFeedInfo().title || feed.title;
      feed.description = getFeedInfo().description || feed.description;
      this.feed = feed;
    },
    setRssUrl(rssUrl: string) {
      this.rssUrl = rssUrl;
    },
    loadMore() {
      if (this.page * this.per >= this.feed.items.length) {
        return;
      }
      this.page = this.page + 1;
    },
    setPage(page: number) {
      this.page = page;
    },
    setPostId(postId: string) {
      this.postId = postId;
      const pagePosts = getPagePosts(this.feed.items, this.page * this.per);
      const post = pagePosts.find(findByPostId(this.postId));
      if (!post) {
        this.prePushedPost = this.feed.items.find(findByPostId(this.postId));
      }
      return;
    },
    setPostExtraMap(posts: any) {
      for (const post of posts) {
        this.postExtraMap[post.fileRId] = post;
      }
    },
  };
}
