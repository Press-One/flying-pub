import { isPc, isMobile, ago } from 'utils';
import _ from 'lodash';

export function createCommentStore() {
  return {
    total: 0,
    previewCount: isPc ? 0 : 2,
    commentMap: {} as any,
    commentIdsSet: new Set(),
    temporaryPreviewMapIdsSet: {} as any,
    openSubCommentPage: false,
    selectedTopComment: null as any,
    openEditorEntryDrawer: false,
    hasMoreComments: false,
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
    reset() {
      this.commentMap = {} as any;
      this.commentIdsSet.clear();
      this.total = 0;
    },
    setTotal(total: number) {
      this.total = total;
    },
    setHasMoreComments(hasMoreComments: boolean) {
      this.hasMoreComments = hasMoreComments;
    },
    addComments(comments: any) {
      for (const comment of comments) {
        if (this.commentIdsSet.has(comment.id)) {
          continue;
        }
        comment.ago = ago(comment.createdAt);
        this.commentMap[comment.id] = comment;
        this.commentIdsSet.add(comment.id);
        if (comment.comments) {
          for (const subComment of comment.comments) {
            subComment.ago = ago(subComment.createdAt);
            this.commentMap[subComment.id] = subComment;
            this.commentIdsSet.add(subComment.id);
          }
        }
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
      this.total += 1;
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
      this.total -= 1;
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
