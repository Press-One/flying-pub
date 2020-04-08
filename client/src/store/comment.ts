export function createCommentStore() {
  let defaultComments: any = [];

  return {
    isFetched: false,
    total: 0,
    comments: defaultComments,
    setTotal(total: number) {
      this.total = total;
    },
    setComments(comments: any) {
      this.comments = comments;
    },
    setIsFetched(status: boolean) {
      this.isFetched = status;
    },
    addComment(comment: any) {
      this.comments.push(comment);
      this.total = this.total + 1;
    },
    updateComment(newComment: any) {
      this.comments = this.comments.map((comment: any) => {
        if (comment.id === newComment.id) {
          return newComment;
        }
        return comment;
      });
    },
    removeComment(commentId: number) {
      this.comments = this.comments.filter((comment: any) => comment.id !== commentId);
      this.total = this.total - 1;
    },
  };
}
