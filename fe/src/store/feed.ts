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
  let prePushedPost: any;
  return {
    feed,
    isFetched: false,
    rssUrl: '',
    per: 10,
    page: 1,
    postId: '',
    prePushedPost,
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
    setFeed(feed: Feed) {
      this.isFetched = true;
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
  };
}
