import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import CommentItem from './commentItem';
import DrawerMenu from 'components/DrawerMenu';
import { Menu, MenuItem } from '@material-ui/core';
import { isMobile, sleep, isPc } from 'utils';
import { useStore } from 'store';

export default observer((props: any) => {
  const {
    stickyComments = [],
    user,
    replyTo,
    upVote,
    resetVote,
    deleteComment,
    stickComment,
    unstickComment,
    selectComment,
    selectedId,
    canStick,
  } = props;
  const state = useLocalStore(() => ({
    showMenu: false,
    anchorEl: null,
    activeMenuComment: {} as any,
  }));
  const { snackbarStore, confirmDialogStore } = useStore();
  const comments = props.comments.filter((comment: any) => !comment.sticky);
  const isOwner = !!user && state.activeMenuComment.userId === user.id;

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
          confirmDialogStore.setLoading(true);
          await stickComment(state.activeMenuComment.id);
          confirmDialogStore.hide();
          if (isMobile) {
            await sleep(100);
            state.showMenu = false;
            await sleep(200);
          } else {
            state.anchorEl = null;
          }
          selectComment(state.activeMenuComment.id);
        } catch (err) {
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
          selectComment(state.activeMenuComment.id);
          if (isPc) {
            await sleep(400);
            snackbarStore.show({
              message: '评论已取消置顶',
            });
          }
        } catch (err) {
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
          confirmDialogStore.setLoading(true);
          await deleteComment(state.activeMenuComment.id);
          confirmDialogStore.hide();
          await sleep(100);
          state.showMenu = false;
          state.anchorEl = null;
          await sleep(200);
          snackbarStore.show({
            message: '评论已删除',
          });
        } catch (err) {
          snackbarStore.show({
            message: '删除失败',
            type: 'error',
          });
        }
      },
    });
  };

  return (
    <div>
      <div className="-mt-2 md:mt-0 md:border-t md:border-gray-300 md:pt-5">
        {stickyComments.map((comment: any, index: number) => {
          const isLast = comments.filter((comment: any) => !comment.sticky).length === 0;
          const highlight = Number(selectedId) === Number(comment.id);
          return (
            <CommentItem
              user={user}
              replyTo={replyTo}
              upVote={upVote}
              resetVote={resetVote}
              comment={comment}
              key={index}
              hideDivider={isLast}
              selectComment={selectComment}
              highlight={highlight}
              canStick={canStick}
              openCommentMenu={openCommentMenu}
            />
          );
        })}
        {comments.map((comment: any, index: number) => {
          const isLast = index === comments.length - 1;
          const highlight = Number(selectedId) === Number(comment.id);
          if (comment.sticky) {
            return null;
          }
          return (
            <CommentItem
              user={user}
              replyTo={replyTo}
              upVote={upVote}
              resetVote={resetVote}
              comment={comment}
              key={index}
              hideDivider={isLast}
              selectComment={selectComment}
              highlight={highlight}
              canStick={canStick}
              openCommentMenu={openCommentMenu}
            />
          );
        })}
      </div>
      <div>
        {isMobile && (canStick || isOwner) && (
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
        {isPc && (canStick || isOwner) && (
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
      </div>
    </div>
  );
});
