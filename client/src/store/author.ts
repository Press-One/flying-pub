import { IAuthor } from 'apis/author';

export function createAuthorStore() {
  return {
    author: {} as IAuthor,
    setAuthor(author: IAuthor) {
      this.author = {
        ...author
      };
    },
    updateAuthor(author: IAuthor) {
      this.author = {
        ...this.author,
        ...author 
      }
    },
    clearAuthor() {
      this.author = {} as IAuthor;
    },
  };
}
