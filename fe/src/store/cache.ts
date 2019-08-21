export function createCacheStore() {
  return {
    feedScrollTop: 0,
    setFeedScrollTop(top: number) {
      this.feedScrollTop = top;
    },
  };
}
