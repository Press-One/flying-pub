export function createCommentStore() {
  let defaultComments: any = [];

  return {
    total: 0,
    comments: defaultComments,
    setTotal(total: number) {
      this.total = total;
    },
    setComments(comments: any) {
      this.comments = comments;
    },
    addComment(comment: any) {
      this.comments.push(comment);
      this.total = this.total + 1;
    },
    removeComment(commentId: number) {
      this.comments = this.comments.filter((comment: any) => comment.id !== commentId);
      this.total = this.total - 1;
    },
  };
}
