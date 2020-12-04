import { isPc, isMobile, ago } from 'utils';
import _ from 'lodash';

export function createCommentStore() {
  return {
    previewCount: isPc ? 0 : 2,
    commentMap: {} as any,
    commentIdsSet: new Set(),
    temporaryPreviewMapIdsSet: {} as any,
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
        if (comment.threadId && !this.commentMap[comment.threadId]) {
          return 0;
        }
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
    get temporaryPreviewMap() {
      const temporaryPreviewMap: any = {};
      for (const threadId in this.temporaryPreviewMapIdsSet) {
        temporaryPreviewMap[threadId] = Array.from(this.temporaryPreviewMapIdsSet[threadId]).map((id: any) => this.commentMap[id]);
      }
      return temporaryPreviewMap;
    },
    get total() {
      let total = 0;
      for (const commentId of this.commentIds) {
        const comment = this.commentMap[commentId];
        if (comment) {
          if (comment.threadId && !this.commentMap[comment.threadId]) {
            total += 0;
          } else {
            total++;
          }
        }
      }
      return total
    },
    setComments(comments: any) {
      this.commentMap = {} as any;
      this.commentIdsSet.clear();
      for (const comment of comments) {
        comment.ago = ago(comment.createdAt);
        this.commentMap[comment.id] = comment;
        this.commentIdsSet.add(comment.id);
      }
    },
    addComment(comment: any) {
      comment.ago = ago(comment.createdAt);
      this.commentMap[comment.id] = comment;
      this.commentIdsSet.add(comment.id);
      if (comment.threadId && !this.openSubCommentPage) {
        const previewIds = this.commentPreviewMap[comment.threadId].map((comment: any) => comment.id);
        if (isMobile && previewIds.includes(comment.id)) {
          return;
        }
        if (!this.temporaryPreviewMapIdsSet[comment.threadId]) {
          this.temporaryPreviewMapIdsSet[comment.threadId] = new Set();
        }
        this.temporaryPreviewMapIdsSet[comment.threadId].add(comment.id);
      }
    },
    updateComment(updatedComment: any) {
      this.commentMap[updatedComment.id].upVotesCount = updatedComment.upVotesCount;
      this.commentMap[updatedComment.id].voted = updatedComment.voted;
    },
    removeComment(commentId: number) {
      if (this.commentMap[commentId].threadId) {
        if (this.temporaryPreviewMapIdsSet[this.commentMap[commentId].threadId]) {
          this.temporaryPreviewMapIdsSet[this.commentMap[commentId].threadId].delete(commentId)
        }
      }
      delete this.commentMap[commentId];
      this.commentIdsSet.delete(commentId);
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
