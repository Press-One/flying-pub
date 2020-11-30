export function createCommentStore() {
  return {
    total: 0,
    comments: [] as any,
    get stickyComments () {
      return this.comments
      .filter((comment: any) => comment.sticky)
      .sort((a: any, b: any) => new Date(a.updatedAt) < new Date(b.updatedAt) ? 1 : -1);
    },
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
    stickComment(commentId: number) {
      const comment = this.comments.find((comment: any) => comment.id === commentId);
      comment.sticky = true;
      comment.updatedAt = new Date().toISOString();
    },
    unstickComment(commentId: number) {
      const comment = this.comments.find((comment: any) => comment.id === commentId);
      comment.sticky = false;
      comment.updatedAt = new Date().toISOString();
    }
  };
}
