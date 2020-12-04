import { isPc, isMobile } from 'utils';
import _ from 'lodash';

export function createCommentStore() {
  return {
    total: 0,
    previewCount: isPc ? 0 : 2,
    commentMap: {} as any,
    commentIdsSet: new Set(),
    temporaryPreviewMap: {} as any,
    openSubCommentPage: false,
    selectedTopComment: null as any,
    openEditorEntryDrawer: false,
    get comments() {
      return this.commentIds.map((rId: string) => this.commentMap[rId]);
    },
    get commentIds(): any {
      return Array.from(this.commentIdsSet);
    },
    get stickyComments () {
      return this.comments
      .filter((comment: any) => comment.sticky)
      .sort((a: any, b: any) => new Date(a.updatedAt) < new Date(b.updatedAt) ? 1 : -1);
    },
    get subCommentsGroupMap () {
      const map: any = _.groupBy(this.comments, (comment: any) => {
        return comment.threadId || 0;
      });
      delete map[0];
      return map;
    },
    get commentPreviewMap() {
      const previewMap: any = {};
      for (const threadId in this.subCommentsGroupMap) {
        previewMap[threadId] = this.subCommentsGroupMap[threadId].slice(0, this.previewCount);
      }
      return previewMap;
    },
    setTotal(total: number) {
      this.total = total;
    },
    setComments(comments: any) {
      this.commentMap = {} as any;
      this.commentIdsSet.clear();
      for (const comment of comments) {
        this.commentMap[comment.id] = comment;
        this.commentIdsSet.add(comment.id);
      }
    },
    addComment(comment: any) {
      this.commentMap[comment.id] = comment;
      this.commentIdsSet.add(comment.id);
      this.total = this.total + 1;
      if (comment.threadId) {
        const previewIds = this.commentPreviewMap[comment.threadId].map((comment: any) => comment.id);
        if (isMobile && previewIds.includes(comment.id)) {
          return;
        }
        if (this.temporaryPreviewMap[comment.threadId]) {
          this.temporaryPreviewMap[comment.threadId].push(comment);
        } else {
          this.temporaryPreviewMap[comment.threadId] = [comment]
        }
      }
    },
    updateComment(updatedComment: any) {
      this.commentMap[updatedComment.id].upVotesCount = updatedComment.upVotesCount;
      this.commentMap[updatedComment.id].voted = updatedComment.voted;
    },
    removeComment(commentId: number) {
      delete this.commentMap[commentId];
      this.commentIdsSet.delete(commentId);
      this.total = this.total - 1;
    },
    stickComment(commentId: number) {
      const comment = this.commentMap[commentId];
      comment.sticky = true;
      comment.updatedAt = new Date().toISOString();
    },
    unstickComment(commentId: number) {
      const comment = this.commentMap[commentId];
      comment.sticky = false;
      comment.updatedAt = new Date().toISOString();
    },
    setOpenSubCommentPage(status: boolean) {
      this.openSubCommentPage = status;
    },
    setSelectedTopComment(comment: any) {
      this.selectedTopComment = comment;
    },
    setOpenEditorEntryDrawer(status: boolean) {
      this.openEditorEntryDrawer = status;
    }
  };
}
