export function createFeedStore() {
  return {
    feed: null,
    isFetched: false,
    rssUrl: '',
    setFeed(feed: any) {
      this.isFetched = true;
      this.feed = feed;
    },
    setRssUrl(rssUrl: string) {
      console.log(` ------------- rssUrl ---------------`, rssUrl);
      this.rssUrl = rssUrl;
    },
  };
}
