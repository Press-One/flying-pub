export function createSubscriptionStore() {
  const authorMap: any = {};
  const addressesSet = new Set();
  return {
    isFetched: false,
    authorMap,
    addressesSet,
    get addresses(): any {
      return Array.from(this.addressesSet);
    },
    get authors() {
      return this.addresses.map((address: string) => this.authorMap[address]);
    },
    addAuthors(authors: any) {
      for (const author of authors) {
        if (!this.addressesSet.has(author.address)) {
          this.authorMap[author.address] = author;
          this.addressesSet.add(author.address);
        }
      }
      this.isFetched = true;
    },
    addAuthor(author: any) {
      this.authorMap[author.address] = author;
      this.addressesSet.add(author.address);
    },
    removeAuthor(address: string) {
      this.addressesSet.delete(address);
    },
  };
}
