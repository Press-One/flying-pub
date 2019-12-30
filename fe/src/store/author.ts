import { Post } from './feed';

export function createAuthorStore() {
  let posts: Post[] = [];
  const author: any = {};
  return {
    author,
    posts,
    limit: 20,
    hasMore: false,
    subscribed: false,
    get length() {
      return this.posts.length;
    },
    reset() {
      this.posts.length = 0;
    },
    setAuthor(author: any) {
      this.author = author;
      this.posts.length = 0;
    },
    setSubscribed(subscribed: boolean) {
      this.subscribed = subscribed;
    },
    addPosts(posts: Post[]) {
      this.posts = [...this.posts, ...posts];
      this.hasMore = this.posts.length === this.limit;
    },
  };
}
