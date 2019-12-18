export function createSubscriptionStore() {
  return {
    isFetched: false,
    authors: [],
    setAuthors(authors: any) {
      this.authors = authors;
      this.isFetched = true;
    },
  };
}
