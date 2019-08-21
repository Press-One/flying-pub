interface Feed {
  description: string;
  feedUrl: string;
  generator: string;
  items: Post[];
  lastBuildDate: string;
  link: string;
  title: string;
}

interface Post {
  content: string;
  contentSnippet: string;
  guid: string;
  isoDate: string;
  link: string;
  pubDate: string;
  title: string;
}

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
  return {
    feed,
    isFetched: false,
    rssUrl: '',
    per: 10,
    page: 1,
    guid: '',
    get pagePosts(): Post[] {
      return this.feed.items.slice(0, this.page * this.per);
    },
    get currentPost() {
      return this.feed.items.find((item: Post) => item.guid === this.guid);
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
    setGuid(guid: string) {
      this.guid = guid;
    },
  };
}
