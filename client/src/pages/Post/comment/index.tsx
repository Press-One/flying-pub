import React from 'react';
import { observer } from 'mobx-react-lite';
import TextField from '@material-ui/core/TextField';
import { faCommentDots, faThumbsUp } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'components/Button';
import DrawerModal from 'components/DrawerModal';
import BottomLine from 'components/BottomLine';
import Fade from '@material-ui/core/Fade';
import debounce from 'lodash.debounce';
import classNames from 'classnames';
import { toJS } from 'mobx';
import Comments from './comments';
import { useStore } from 'store';
import {
  sleep,
  stopBodyScroll,
  isMobile,
  isPc,
  getQuery,
  scrollToElementById,
  getScrollTop,
  scrollToHere,
} from 'utils';
import CommentApi from 'apis/comment';
import Api from 'api';

interface IProps {
  isMyself: boolean;
  authorAddress: string;
  fileRId: number;
  alwaysShowCommentEntry: boolean;
  tryVote: () => void;
}

export default observer((props: IProps) => {
  const { commentStore, feedStore, snackbarStore, userStore, modalStore } = useStore();
  const { total, hasMoreComments } = commentStore;
  const { user, isLogin } = userStore;

  const [value, setValue] = React.useState('');
  const [drawerReplyValue, setDrawerReplyValue] = React.useState('');
  const [replyingComment, setReplyingComment] = React.useState<any>(null);
  const [isCreatingComment, setIsCreatingComment] = React.useState(false);
  const [isCreatedComment, setIsCreatedComment] = React.useState(false);
  const [isDrawerCreatingComment, setIsDrawerCreatingComment] = React.useState(false);
  const [isDrawerCreatedComment, setIsDrawerCreatedComment] = React.useState(false);
  const [openDrawer, setOpenDrawer] = React.useState(false);
  const [openCommentEntry, setOpenCommentEntry] = React.useState(false);
  const [isVoting, setIsVoting] = React.useState(false);
  const { fileRId, alwaysShowCommentEntry } = props;
  const [selectedCommentId, setSelectedCommentId] = React.useState(getQuery('commentId') || '0');
  const cachedScrollTop = React.useRef(0);
  const [visualViewportHeight, setVisualViewportHeight] = React.useState(
    (window as any).outerHeight,
  );

  React.useEffect(() => {
    setValue(localStorage.getItem('COMMENT_CONTENT') || '');
  }, []);

  React.useEffect(() => {
    const scrollCallBack = debounce(() => {
      const commentDom: any = document.querySelector('.comment');
      if (!commentDom) {
        return;
      }
      const commentOffsetTop = commentDom.offsetTop;
      const isShowCommentEntry = window.scrollY + window.innerHeight > commentOffsetTop + 50;
      setOpenCommentEntry(isShowCommentEntry);
    }, 300);
    window.addEventListener('scroll', scrollCallBack);
    return () => {
      window.removeEventListener('scroll', scrollCallBack);
    };
  }, []);

  const getIsKeyboardActive = () =>
    (window as any).visualViewport.height + 150 < (window as any).outerHeight;

  React.useEffect(() => {
    if (isPc) {
      return;
    }
    if (isDrawerCreatingComment || !getIsKeyboardActive()) {
      (async () => {
        await sleep(1);
        if (cachedScrollTop.current > 0) {
          scrollToHere(cachedScrollTop.current);
        }
        cachedScrollTop.current = 0;
      })();
    }
  }, [visualViewportHeight, isDrawerCreatingComment]);

  React.useEffect(() => {
    commentStore.setOpenEditorEntryDrawer(openDrawer);
    if (isMobile) {
      if (openDrawer) {
        cachedScrollTop.current = getScrollTop();
      }
    }
  }, [openDrawer, commentStore, cachedScrollTop]);

  React.useEffect(() => {
    if (isPc) {
      return;
    }
    const timer = setInterval(() => {
      setVisualViewportHeight((window as any).visualViewport.height);
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const selectComment = React.useCallback(
    (selectedCommentId, options: any = {}) => {
      (async () => {
        if (options.silent) {
          scrollToElementById(`#comment_${selectedCommentId}`, options);
          return;
        }
        setSelectedCommentId(`${selectedCommentId}`);
        if (options.isNewComment) {
          options.useScrollIntoView = true;
          options.disabledScrollIfVisible = isPc;
        }
        const element: any = scrollToElementById(`#comment_${selectedCommentId}`, options);
        modalStore.closePageLoading();
        if (!element) {
          setSelectedCommentId('');
        }
        await sleep(options.isNewComment ? 1000 : 1500);
        setSelectedCommentId('');
      })();
    },
    [modalStore],
  );

  const reply = async () => {
    if (isCreatingComment || isDrawerCreatingComment) {
      return;
    }
    const _value = ((openDrawer ? drawerReplyValue : value) || '').trim();
    if (!_value) {
      return;
    }
    forceBlur();
    openDrawer ? setIsDrawerCreatingComment(true) : setIsCreatingComment(true);
    openDrawer ? setIsDrawerCreatedComment(false) : setIsCreatedComment(false);
    try {
      const comment: any = {
        content: _value,
        objectId: fileRId,
        objectType: 'post',
      };
      const mentionsUserIds = getMentionUserIds(_value, commentStore.comments);
      if (replyingComment) {
        comment.replyId = replyingComment.id;
        comment.threadId = replyingComment.threadId || replyingComment.id;
        if (!mentionsUserIds.includes(replyingComment.user.id)) {
          mentionsUserIds.push(replyingComment.user.id);
        }
      }
      const newComment = await CommentApi.create({
        ...comment,
        options: { mentionsUserIds },
      });
      commentStore.addComment(newComment);
      feedStore.updatePost(feedStore.post.rId, {
        commentsCount: commentStore.total,
      });
      openDrawer ? setIsDrawerCreatedComment(true) : setIsCreatedComment(true);
      if (openDrawer) {
        setOpenDrawer(false);
        stopBodyScroll(false);
        setReplyingComment(null);
      }
      setDrawerReplyValue('');
      setValue('');
      localStorage.removeItem('COMMENT_CONTENT');
      if (replyingComment) {
        localStorage.removeItem(`COMMENT_REPLY:${replyingComment.id}_CONTENT`);
      }
      const silent = !(
        isMobile &&
        replyingComment &&
        !replyingComment.threadId &&
        !commentStore.openSubCommentPage
      );
      if (silent) {
        await sleep(100);
        selectComment(newComment.id, {
          useScrollIntoView: true,
          isNewComment: true,
        });
      }
      snackbarStore.show({
        message: '发布成功',
        duration: 1000,
      });
    } catch (e) {
      if (e.status === 404) {
        const message = e.message.includes('post')
          ? '文章已经被作者删除了'
          : '评论已经被 Ta 删除了';
        snackbarStore.show({
          message,
          type: 'error',
        });
      } else {
        let msg;
        if (e.message.includes('comment is invalid. reason: comment contains sensitive words')) {
          msg = '您的评论含有敏感词';
        }
        snackbarStore.show({
          message: msg || e.message || '发布失败，请稍后重试',
          type: 'error',
        });
      }
    } finally {
      openDrawer ? setIsDrawerCreatingComment(false) : setIsCreatingComment(false);
    }
  };

  const getMentionUserIds = (content: string, comments: any = []) => {
    const users: any = comments.map((comment: any) => toJS(comment.user));
    const matched: any = content.match(/@([^ ]*) /g) || [];
    const mentionUserNames = matched.map((mention: string) => mention.replace('@', '').trim());
    const mentionUserIds = new Set();
    for (const name of mentionUserNames) {
      const user = users.find(
        (user: any) => user.nickname === name || user.nickname.startsWith(name),
      );
      if (user) {
        mentionUserIds.add(user.id);
      }
    }
    return Array.from(mentionUserIds);
  };

  const upVote = async (commentId: number) => {
    if (isVoting) {
      return;
    }
    setIsVoting(true);
    try {
      const comment = await Api.createVote({
        objectType: 'comments',
        objectId: commentId,
        type: 'UP',
      });
      commentStore.updateComment(comment);
    } catch (err) {
      if (err.status === 404) {
        snackbarStore.show({
          message: '评论已经被 Ta 删除了',
          type: 'error',
        });
      }
    }
    setIsVoting(false);
  };

  const resetVote = async (commentId: number) => {
    if (isVoting) {
      return;
    }
    setIsVoting(true);
    try {
      const comment = await Api.deleteVote({
        objectType: 'comments',
        objectId: commentId,
      });
      commentStore.updateComment(comment);
    } catch (err) {
      if (err.status === 404) {
        snackbarStore.show({
          message: '评论已经被 Ta 删除了',
          type: 'error',
        });
      }
    }
    setIsVoting(false);
  };

  const deleteComment = async (commentId: number) => {
    await CommentApi.delete(commentId);
    commentStore.removeComment(commentId);
    feedStore.updatePost(feedStore.post.rId, {
      commentsCount: commentStore.total,
    });
  };

  const stickComment = async (commentId: number) => {
    await CommentApi.stick(commentId);
    commentStore.stickComment(commentId);
  };

  const unstickComment = async (commentId: number) => {
    await CommentApi.unstick(commentId);
    commentStore.unstickComment(commentId);
  };

  const handleEditorChange = (event: any) => {
    openDrawer ? setDrawerReplyValue(event.target.value) : setValue(event.target.value);
    if (replyingComment) {
      localStorage.setItem(`COMMENT_REPLY:${replyingComment.id}_CONTENT`, event.target.value);
    } else {
      localStorage.setItem('COMMENT_CONTENT', event.target.value);
    }
  };

  const forceBlur = () => {
    setTimeout(() => {
      const canTriggerBlurDom: any = document.querySelector('body');
      canTriggerBlurDom.click();
    }, 100);
  };

  const renderEditor = (options: any = {}) => {
    const { user, valueState, isDoing, isDone, isFromDrawer, replyingComment } = options;
    return (
      <div className="mt-2 md:mt-0 comment-editor-container">
        <div className="mb-2">
          {isFromDrawer && replyingComment && (
            <div style={{ marginLeft: isMobile ? '1px' : '36px' }} className="md:pl-3 pt-1">
              <div
                className="border-gray-bd pl-2 text-12 cursor-pointer"
                style={{ borderLeftWidth: '3px' }}
              >
                <div className="truncate text-gray-99">{replyingComment.content}</div>
              </div>
            </div>
          )}
          {isFromDrawer && !replyingComment && <div className="pt-1" />}
        </div>
        <div className="flex items-start pb-2 md:pb-0">
          <img
            className="hidden md:block mr-3 rounded-full"
            src={
              user && user.avatar ? user.avatar : 'https://static-assets.xue.cn/images/435d111.jpg'
            }
            width="36px"
            height="36px"
            alt="avatar"
          />
          <div className="w-full -mt-4 relative">
            <TextField
              id="comment-text-field"
              className="po-input po-text-14 textarea"
              placeholder={
                replyingComment ? `回复 ${replyingComment.user.nickname}` : '说点什么...'
              }
              multiline
              fullWidth
              disabled={!isLogin}
              rows={isMobile ? 3 : 5}
              value={valueState}
              onChange={handleEditorChange}
              margin="normal"
              variant="outlined"
              inputProps={{ maxLength: 1500 }}
            />
            {!isLogin && (
              <div className="text-gray-600 absolute top-0 left-0 mt-5 ml-1 bg-white p-3">
                评论之前请先
                <span className="text-blue-400 cursor-pointer" onClick={modalStore.openLogin}>
                  登录
                </span>
              </div>
            )}
            <div className="mt-1"></div>
            <div className="text-right">
              <Button
                onClick={() => reply()}
                size="small"
                isDoing={isDoing}
                isDone={isDone}
                color={valueState ? 'primary' : 'gray'}
              >
                发布
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const replyTo = (comment: any) => {
    setReplyingComment(comment);
    setOpenDrawer(true);
    setTimeout(() => {
      const cachedContent = localStorage.getItem(`COMMENT_REPLY:${comment.id}_CONTENT`) || '';
      const replyValue = cachedContent ? cachedContent : drawerReplyValue;
      setDrawerReplyValue(replyValue);
    }, 400);
  };

  const renderFixedCommentEntry = () => {
    return (
      <Fade in={true} timeout={200}>
        <div className="fixed entry bottom-0 left-0 w-full py-2 border-t border-gray-300 bg-white flex items-center justify-between">
          <div
            className={classNames(
              {
                'mx-4': commentStore.openSubCommentPage,
              },
              'flex-1 mx-3 rounded-lg bg-gray-f2 text-gray-88 py-2 px-3',
            )}
            onClick={() => {
              if (commentStore.selectedTopComment) {
                replyTo(commentStore.selectedTopComment);
              } else {
                setOpenDrawer(true);
                stopBodyScroll(true);
                setTimeout(() => {
                  setDrawerReplyValue(localStorage.getItem('COMMENT_CONTENT') || '');
                }, 400);
              }
            }}
          >
            {commentStore.openSubCommentPage
              ? `回复 ${commentStore.selectedTopComment.user.nickname}`
              : '写评论...'}
          </div>
          {!commentStore.openSubCommentPage && (
            <div className="flex items-center py-1 text-gray-99">
              {total > 0 && (
                <div
                  className="text-xl px-4 mr-1 relative font-bold"
                  onClick={() => {
                    const commentSection = document.getElementById('comment-section');
                    if (commentSection) {
                      commentSection.scrollIntoView();
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faCommentDots} />
                  <span className="absolute top-0 right-0 comment-badge">{total}</span>
                </div>
              )}
              <div
                onClick={() => props.tryVote()}
                className={classNames(
                  {
                    'text-blue-400': feedStore.post.voted,
                  },
                  'text-xl pl-4 pr-6 relative font-bold',
                )}
              >
                <FontAwesomeIcon icon={faThumbsUp} />
                {feedStore.post.upVotesCount > 0 && (
                  <span className="absolute top-0 right-0 like-badge">
                    {feedStore.post.upVotesCount}
                  </span>
                )}
              </div>
            </div>
          )}
          <style jsx>{`
            .comment-badge {
              font-size: 12px;
              top: -3px;
              left: 38px;
            }
            .like-badge {
              font-size: 12px;
              top: -3px;
              left: 37px;
            }
            .entry {
              z-index: 1001;
            }
          `}</style>
        </div>
      </Fade>
    );
  };

  const renderMain = () => {
    const hasComments = total > 0;
    return (
      <div className="pb-8 md:pb-0 comment" id="comment-section">
        {hasComments && isMobile && <div className="mt-8 pb-4 border-t border-gray-300" />}
        {!hasComments && isMobile && <div className="mt-10" />}
        {(hasComments || isPc) && (
          <div>
            <div className="text-16 md:text-lg font-bold flex text-gray-700">
              <div className="flex items-center">
                <span className="text-xl mr-2">
                  <FontAwesomeIcon icon={faCommentDots} />
                </span>{' '}
                全部评论（{total}）
              </div>
            </div>
            <div className="mt-2 md:mt-5" />
          </div>
        )}
        {isPc &&
          renderEditor({
            user,
            valueState: value,
            isDoing: isCreatingComment,
            isCreated: isCreatedComment,
          })}
        {hasComments && isPc && <div className="mt-8" />}
        <DrawerModal
          hideCloseButton
          open={openDrawer}
          onClose={() => {
            setDrawerReplyValue('');
            setReplyingComment(null);
            setOpenDrawer(false);
            stopBodyScroll(false);
          }}
        >
          <div className="container m-auto">
            <div className="w-11/12 md:w-7/12 m-auto md:pt-2 pb-1 md:pb-3">
              {renderEditor({
                user,
                valueState: drawerReplyValue,
                isDoing: isDrawerCreatingComment,
                isCreated: isDrawerCreatedComment,
                replyingComment,
                isFromDrawer: true,
              })}
            </div>
          </div>
        </DrawerModal>
        {hasComments && (
          <div id="comments" className="overflow-hidden -mx-4">
            <Comments
              user={user}
              deleteComment={deleteComment}
              stickComment={stickComment}
              unstickComment={unstickComment}
              replyTo={replyTo}
              upVote={upVote}
              resetVote={resetVote}
              selectComment={selectComment}
              selectedId={selectedCommentId}
              isAuthor={props.isMyself}
              authorAddress={props.authorAddress}
            />
          </div>
        )}
        {!hasMoreComments && <BottomLine />}
        {isPc && !hasMoreComments && total > 3 && (
          <div className="text-center mt-2">
            <span
              className="py-3 text-blue-400 cursor-pointer"
              onClick={() => {
                setOpenDrawer(true);
                stopBodyScroll(true);
                setTimeout(() => {
                  setDrawerReplyValue(localStorage.getItem('COMMENT_CONTENT') || '');
                }, 400);
              }}
            >
              说点什么
            </span>
          </div>
        )}

        {isMobile &&
          (openCommentEntry || alwaysShowCommentEntry) &&
          !commentStore.openEditorEntryDrawer &&
          !(
            commentStore.openSubCommentPage &&
            commentStore.selectedTopComment.user.address === user.address
          ) &&
          renderFixedCommentEntry()}
      </div>
    );
  };

  return renderMain();
});
