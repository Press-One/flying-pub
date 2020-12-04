import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import CommentItem from './commentItem';
import DrawerMenu from 'components/DrawerMenu';
import { Menu, MenuItem } from '@material-ui/core';
import { isMobile, sleep, isPc } from 'utils';
import { useStore } from 'store';
import classNames from 'classnames';
import Fade from '@material-ui/core/Fade';
import DrawerModal from 'components/DrawerModal';
import BottomLine from 'components/BottomLine';
import Loading from 'components/Loading';

export default observer((props: any) => {
  const {
    user,
    replyTo,
    upVote,
    resetVote,
    deleteComment,
    stickComment,
    unstickComment,
    selectComment,
    selectedId,
    isAuthor,
    authorAddress,
  } = props;
  const state = useLocalStore(() => ({
    showMenu: false,
    anchorEl: null,
    activeMenuComment: {} as any,
    showSubCommentsMap: {} as any,
    showTopCommentLoading: false,
    autoHandledQuery: false,
  }));
  const { snackbarStore, confirmDialogStore, commentStore, modalStore } = useStore();
  const {
    stickyComments,
    subCommentsGroupMap,
    commentPreviewMap,
    temporaryPreviewMap,
    comments,
    openSubCommentPage,
    selectedTopComment,
    commentMap,
  } = commentStore;
  const topComments = comments.filter((comment: any) => !comment.sticky && !comment.threadId);
  const isOwner = !!user && state.activeMenuComment.userId === user.id;
  const canStick = isAuthor && !state.activeMenuComment.threadId;
  const selectedComment = commentMap[selectedId];

  React.useEffect(() => {
    if (state.autoHandledQuery) {
      return;
    }
    if (openSubCommentPage) {
      return;
    }
    if (!selectedId || selectedId === '0') {
      state.autoHandledQuery = true;
      return;
    }
    (async () => {
      if (!selectedComment) {
        modalStore.closePageLoading();
        await sleep(200);
        confirmDialogStore.show({
          content: '这条评论已经被 Ta 删除了',
          cancelDisabled: true,
          okText: '我知道了',
          ok: () => {
            confirmDialogStore.hide();
          },
        });
        return;
      }
      if (selectedComment.threadId) {
        if (isPc) {
          state.showSubCommentsMap[selectedComment.threadId] = true;
          await sleep(400);
          selectComment(selectedId, {
            useScrollIntoView: true,
          });
        } else {
          modalStore.closePageLoading();
          await sleep(200);
          const comment = commentStore.commentMap[selectedComment.threadId];
          state.showTopCommentLoading = true;
          commentStore.setSelectedTopComment(comment);
          commentStore.setOpenSubCommentPage(true);
          await sleep(200);
          selectComment(selectedId, {
            useScrollIntoView: true,
          });
          await sleep(200);
          selectComment(selectedComment.threadId, {
            useScrollIntoView: true,
            silent: true,
          });
          await sleep(100);
          state.showTopCommentLoading = false;
        }
      } else {
        await sleep(400);
        selectComment(selectedId, {
          useScrollIntoView: true,
        });
      }
      state.autoHandledQuery = true;
    })();
  }, [
    state,
    selectedId,
    selectComment,
    selectedComment,
    commentStore,
    modalStore,
    openSubCommentPage,
    confirmDialogStore,
  ]);

  const openCommentMenu = (comment: any, e: any) => {
    state.activeMenuComment = comment;
    if (isMobile) {
      state.showMenu = true;
    } else {
      handleMenuClick(e);
    }
  };

  const handleMenuClick = (e: any) => {
    state.anchorEl = e.currentTarget;
  };

  const handleMenuClose = () => {
    state.anchorEl = null;
  };

  const tryStick = async () => {
    confirmDialogStore.show({
      content: '确定置顶这条评论？',
      ok: async () => {
        try {
          if (isPc) {
            state.anchorEl = null;
          }
          confirmDialogStore.setLoading(true);
          await stickComment(state.activeMenuComment.id);
          confirmDialogStore.hide();
          if (isMobile) {
            await sleep(100);
            state.showMenu = false;
            await sleep(200);
          }
          if (openSubCommentPage) {
            snackbarStore.show({
              message: '置顶成功',
              duration: 1000,
            });
          } else {
            selectComment(state.activeMenuComment.id);
          }
        } catch (err) {
          console.log(err);
          snackbarStore.show({
            message: '置顶失败',
            type: 'error',
          });
        }
      },
    });
  };

  const tryUnstick = () => {
    confirmDialogStore.show({
      content: '取消置顶这条评论？',
      ok: async () => {
        try {
          confirmDialogStore.setLoading(true);
          await unstickComment(state.activeMenuComment.id);
          confirmDialogStore.hide();
          if (isMobile) {
            await sleep(100);
            state.showMenu = false;
            await sleep(200);
            snackbarStore.show({
              message: '评论已取消置顶',
              duration: 1000,
            });
            await sleep(500);
          } else {
            state.anchorEl = null;
          }
          if (!openSubCommentPage) {
            selectComment(state.activeMenuComment.id);
          }
          if (isPc) {
            await sleep(400);
            snackbarStore.show({
              message: '评论已取消置顶',
            });
          }
        } catch (err) {
          console.log(err);
          snackbarStore.show({
            message: '取消置顶失败',
            type: 'error',
          });
        }
      },
    });
  };

  const tryDelete = () => {
    confirmDialogStore.show({
      content: '确定删除这条评论？',
      ok: async () => {
        try {
          state.anchorEl = null;
          confirmDialogStore.setLoading(true);
          await deleteComment(state.activeMenuComment.id);
          confirmDialogStore.hide();
          await sleep(100);
          state.showMenu = false;
          await sleep(100);
          if (
            commentStore.openSubCommentPage &&
            commentStore.selectedTopComment.id === state.activeMenuComment.id
          ) {
            commentStore.setOpenSubCommentPage(false);
            await sleep(200);
            commentStore.setSelectedTopComment(null);
          }
          snackbarStore.show({
            message: '评论已删除',
            duration: 1000,
          });
        } catch (err) {
          console.log(err);
          snackbarStore.show({
            message: '删除失败',
            type: 'error',
          });
        }
      },
    });
  };

  const TopCommentPage = () => {
    return (
      <div className="relative">
        <div className="font-bold items-center text-16 text-center border-b border-gray-200 py-3">
          评论详情
        </div>
        <div className="height overflow-y-auto">
          <div className="pt-1">
            <CommentItem
              user={user}
              replyTo={replyTo}
              upVote={upVote}
              resetVote={resetVote}
              comment={selectedTopComment}
              hideDivider={true}
              selectComment={selectComment}
              authorAddress={authorAddress}
              openCommentMenu={openCommentMenu}
              isActiveMenu={state.activeMenuComment.id === selectedTopComment.id && state.anchorEl}
              noSubComments
            />
          </div>
          {subCommentsGroupMap[selectedTopComment.id] && (
            <div>
              <div className="pb-6-px bg-gray-f7" />
              <div className="pt-3 pb-1 px-4 text-16 font-bold text-gray-700">
                全部回复（{subCommentsGroupMap[selectedTopComment.id].length}）
              </div>
              <div>
                {subCommentsGroupMap[selectedTopComment.id].map(
                  (subComment: any, index: number) => {
                    const isLast = index === subCommentsGroupMap[selectedTopComment.id].length - 1;
                    const highlight = Number(selectedId) === Number(subComment.id);
                    return (
                      <div key={index}>
                        <CommentItem
                          user={user}
                          replyTo={replyTo}
                          upVote={upVote}
                          resetVote={resetVote}
                          comment={subComment}
                          hideDivider={isLast}
                          selectComment={selectComment}
                          highlight={highlight}
                          authorAddress={authorAddress}
                          openCommentMenu={openCommentMenu}
                          isActiveMenu={
                            state.activeMenuComment.id === subComment.id && state.anchorEl
                          }
                          noSubComments
                        />
                      </div>
                    );
                  },
                )}
              </div>
              {subCommentsGroupMap[selectedTopComment.id].length > 2 && <BottomLine />}
              <div className="pb-20" />
            </div>
          )}
        </div>
        {state.showTopCommentLoading && (
          <div
            style={{ height: '98vh' }}
            className="absolute top-0 left-0 right-0 bottom-0 bg-white z-10 flex items-center justify-center rounded-12"
          >
            <Loading />
          </div>
        )}
        <style jsx>{`
          .height {
            height: calc(98vh - 49px);
          }
        `}</style>
      </div>
    );
  };

  const Comments = (comments: any, options: any = {}) => {
    return comments.map((comment: any, index: number) => {
      const isLast = options.isSticky
        ? options.topCommentLength === 0
        : index === comments.length - 1;
      const highlight = Number(selectedId) === Number(comment.id);
      const hasSubComments = subCommentsGroupMap[comment.id];
      const noSubComments = !hasSubComments;
      return (
        <div
          key={`${(options.isSticky ? 'sticky' : '') + index}`}
          className={classNames({
            'border-b border-gray-200': !isLast && !noSubComments,
          })}
        >
          <CommentItem
            user={user}
            replyTo={replyTo}
            upVote={upVote}
            resetVote={resetVote}
            comment={comment}
            hideDivider={isLast}
            selectComment={selectComment}
            highlight={highlight}
            authorAddress={authorAddress}
            openCommentMenu={openCommentMenu}
            isActiveMenu={state.activeMenuComment.id === comment.id && state.anchorEl}
            noSubComments={noSubComments}
            isTopComment
          />
          {hasSubComments && (
            <div
              className={classNames(
                {
                  'pb-4': isMobile,
                  highlight: isPc && highlight,
                },
                'pl-4 duration-500 ease-in-out transition-all',
              )}
            >
              <div className="ml-10-px md:ml-3" style={{ paddingLeft: '36px' }}>
                <div
                  className={classNames({
                    'bg-gray-f7 rounded md:bg-none p-3 pb-10-px mt-2 mr-4': isMobile,
                  })}
                  onClick={() => {
                    if (isMobile) {
                      commentStore.setSelectedTopComment(comment);
                      commentStore.setOpenSubCommentPage(true);
                    }
                  }}
                >
                  {isMobile && commentPreviewMap[comment.id] && (
                    <div className="-mt-4-px">
                      {commentPreviewMap[comment.id].map((subComment: any, index: number) => {
                        return (
                          <div key={index}>
                            <CommentItem
                              user={user}
                              replyTo={replyTo}
                              upVote={upVote}
                              resetVote={resetVote}
                              comment={subComment}
                              selectComment={selectComment}
                              authorAddress={authorAddress}
                              openCommentMenu={openCommentMenu}
                              isPreview
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {isMobile && temporaryPreviewMap[comment.id] && (
                    <div>
                      {temporaryPreviewMap[comment.id].map((subComment: any, index: number) => {
                        return (
                          <div key={index}>
                            <CommentItem
                              user={user}
                              replyTo={replyTo}
                              upVote={upVote}
                              resetVote={resetVote}
                              comment={subComment}
                              selectComment={selectComment}
                              authorAddress={authorAddress}
                              openCommentMenu={openCommentMenu}
                              isPreview
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {isMobile &&
                    subCommentsGroupMap[comment.id].length >
                      commentPreviewMap[comment.id].length +
                        (temporaryPreviewMap[comment.id] || []).length && (
                      <span className="text-blue-400 cursor-pointer mt-2 inline-block leading-none">
                        共 {subCommentsGroupMap[comment.id].length} 条回复 {'>'}
                      </span>
                    )}
                  {isPc &&
                    subCommentsGroupMap[comment.id].length >
                      (temporaryPreviewMap[comment.id] || []).length && (
                      <span
                        className={classNames(
                          {
                            'pb-2': !state.showSubCommentsMap[comment.id],
                          },
                          'text-blue-400 cursor-pointer mt-1 inline-block',
                        )}
                        onClick={() => {
                          state.showSubCommentsMap[comment.id] = !state.showSubCommentsMap[
                            comment.id
                          ];
                          if (temporaryPreviewMap[comment.id]) {
                            delete temporaryPreviewMap[comment.id];
                          }
                        }}
                      >
                        {state.showSubCommentsMap[comment.id] ? '收起' : '查看'}{' '}
                        {subCommentsGroupMap[comment.id].length} 条回复
                      </span>
                    )}
                  {isPc && state.showSubCommentsMap[comment.id] && (
                    <Fade in={true} timeout={500}>
                      <div>
                        {subCommentsGroupMap[comment.id].map((subComment: any, index: number) => {
                          const isLast = index === subCommentsGroupMap[comment.id].length - 1;
                          const highlight = Number(selectedId) === Number(subComment.id);
                          return (
                            <div key={index}>
                              <CommentItem
                                user={user}
                                replyTo={replyTo}
                                upVote={upVote}
                                resetVote={resetVote}
                                comment={subComment}
                                hideDivider={isLast}
                                selectComment={selectComment}
                                highlight={highlight}
                                authorAddress={authorAddress}
                                openCommentMenu={openCommentMenu}
                                isActiveMenu={
                                  state.activeMenuComment.id === subComment.id && state.anchorEl
                                }
                                noSubComments
                                isPcSubComment
                              />
                            </div>
                          );
                        })}
                      </div>
                    </Fade>
                  )}
                  {isPc &&
                    !state.showSubCommentsMap[comment.id] &&
                    temporaryPreviewMap[comment.id] && (
                      <div
                        className={classNames({
                          '-mt-3':
                            subCommentsGroupMap[comment.id].length >
                            (temporaryPreviewMap[comment.id] || []).length,
                        })}
                      >
                        {temporaryPreviewMap[comment.id].map((subComment: any, index: number) => {
                          const isLast = index === temporaryPreviewMap[comment.id].length - 1;
                          const highlight = Number(selectedId) === Number(subComment.id);
                          return (
                            <div key={index}>
                              <CommentItem
                                user={user}
                                replyTo={replyTo}
                                upVote={upVote}
                                resetVote={resetVote}
                                comment={subComment}
                                hideDivider={isLast}
                                selectComment={selectComment}
                                highlight={highlight}
                                authorAddress={authorAddress}
                                openCommentMenu={openCommentMenu}
                                isActiveMenu={
                                  state.activeMenuComment.id === subComment.id && state.anchorEl
                                }
                                noSubComments
                                isPcSubComment
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
          <style jsx>{`
            .highlight {
              background: #e2f6ff;
            }
          `}</style>
        </div>
      );
    });
  };

  return (
    <div>
      <div className="-mt-2 md:mt-0 md:border-t md:border-gray-300 md:pt-5">
        {Comments(stickyComments, {
          isSticky: true,
          topCommentLength: topComments.length,
        })}
        {Comments(topComments)}
      </div>
      <div>
        {isMobile && (isAuthor || isOwner) && (
          <DrawerMenu
            open={state.showMenu}
            onClose={() => {
              state.showMenu = false;
            }}
            items={[
              {
                invisible: !canStick || state.activeMenuComment.sticky,
                name: '置顶',
                onClick: tryStick,
                stayOpenAfterClick: true,
              },
              {
                invisible: !canStick || !state.activeMenuComment.sticky,
                name: '取消置顶',
                onClick: tryUnstick,
                className: 'text-red-400',
                stayOpenAfterClick: true,
              },
              {
                invisible: !isOwner,
                name: '删除',
                onClick: tryDelete,
                className: 'text-red-400',
                stayOpenAfterClick: true,
              },
            ]}
          />
        )}
        {isPc && (isAuthor || isOwner) && (
          <Menu
            anchorEl={state.anchorEl}
            open={Boolean(state.anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            PaperProps={{
              style: {
                width: 100,
              },
            }}
          >
            {canStick && !state.activeMenuComment.sticky && (
              <MenuItem onClick={tryStick}>
                <div className="flex items-center text-gray-700 leading-none py-1">
                  <span className="font-bold">置顶</span>
                </div>
              </MenuItem>
            )}
            {canStick && state.activeMenuComment.sticky && (
              <MenuItem onClick={tryUnstick}>
                <div className="flex items-center text-gray-700 leading-none py-1">
                  <span className="font-bold">取消置顶</span>
                </div>
              </MenuItem>
            )}
            {isOwner && (
              <MenuItem onClick={tryDelete}>
                <div className="flex items-center text-gray-700 leading-none py-1">
                  <span className="font-bold">删除</span>
                </div>
              </MenuItem>
            )}
          </Menu>
        )}
        {isMobile && (
          <DrawerModal
            open={openSubCommentPage}
            useCustomZIndex
            onClose={async () => {
              commentStore.setOpenSubCommentPage(false);
              await sleep(200);
              commentStore.setSelectedTopComment(null);
            }}
          >
            {selectedTopComment && TopCommentPage()}
          </DrawerModal>
        )}
      </div>
    </div>
  );
});
