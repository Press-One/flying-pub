import React from 'react';
import { observer } from 'mobx-react-lite';
import TextField from '@material-ui/core/TextField';
import ThumbUp from '@material-ui/icons/ThumbUp';
import CommentIcon from '@material-ui/icons/Comment';
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
  initMathJax,
  getQuery,
  removeQuery,
  scrollToHere,
} from 'utils';
import CommentApi from './api';
import Api from 'api';

interface IProps {
  fileRId: number;
  alwaysShowCommentEntry: boolean;
  tryVote: () => void;
}

export default observer((props: IProps) => {
  const {
    commentStore,
    feedStore,
    snackbarStore,
    userStore,
    modalStore,
    confirmDialogStore,
  } = useStore();
  const { total, comments } = commentStore;
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

  React.useEffect(() => {
    initMathJax(document.getElementById('comments'));
  }, []);

  React.useEffect(() => {
    if (!selectedCommentId) {
      return;
    }
    (async () => {
      await sleep(500);
      const commentEle: any = document.querySelector(`#comment_${selectedCommentId}`);
      if (commentEle) {
        scrollToHere(commentEle.offsetTop);
        modalStore.closePageLoading();
        removeQuery('commentId');
        await sleep(2000);
        setSelectedCommentId('');
      } else {
        modalStore.closePageLoading();
      }
    })();
  }, [selectedCommentId, modalStore]);

  const reply = async () => {
    if (isCreatingComment || isDrawerCreatingComment) {
      return;
    }
    const _value = ((openDrawer ? drawerReplyValue : value) || '').trim();
    if (!_value) {
      snackbarStore.show({
        message: '请输入发布内容',
        type: 'error',
      });
      return;
    }
    forceBlur();
    openDrawer ? setIsDrawerCreatingComment(true) : setIsCreatingComment(true);
    openDrawer ? setIsDrawerCreatedComment(false) : setIsCreatedComment(false);
    try {
      const comment = {
        content: _value,
        objectId: fileRId,
        objectType: 'post',
      };
      const mentionsUserIds = getMentionUserIds(_value, commentStore.comments);
      const newComment = await CommentApi.create({
        ...comment,
        options: { mentionsUserIds },
      });
      await sleep(500);
      commentStore.addComment(newComment);
      initMathJax(document.getElementById('comments'));
      feedStore.updatePost(feedStore.post.rId, {
        commentsCount: commentStore.total,
      });
      openDrawer ? setIsDrawerCreatedComment(true) : setIsCreatedComment(true);
      if (openDrawer) {
        setOpenDrawer(false);
        stopBodyScroll(false);
      }
      setDrawerReplyValue('');
      setValue('');
      localStorage.removeItem('COMMENT_CONTENT');
      if (replyingComment) {
        localStorage.removeItem(`COMMENT_REPLY:${replyingComment.id}_CONTENT`);
      }
      scrollToHere(99999);
    } catch (e) {
      console.log(e);
      let msg;
      if (e.message.includes('comment is invalid. reason: comment contains sensitive words')) {
        msg = '您的评论含有敏感词';
      }
      snackbarStore.show({
        message: msg || e.message || '发布失败，请稍后重试',
        type: 'error',
      });
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
    } catch (err) {}
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
    } catch (err) {}
    setIsVoting(false);
  };

  const tryDeleteComment = async (commentId: number) => {
    confirmDialogStore.show({
      content: '确定删除这条评论？',
      ok: async () => {
        confirmDialogStore.setLoading(true);
        await sleep(500);
        await deleteComment(commentId);
        confirmDialogStore.hide();
      },
    });
  };

  const deleteComment = async (commentId: number) => {
    try {
      await CommentApi.delete(commentId);
      commentStore.removeComment(commentId);
    } catch (e) {
      snackbarStore.show({
        message: '删除失败，请稍后重试',
        type: 'error',
      });
    }
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
    const { user, valueState, isDoing, isDone } = options;
    return (
      <div>
        <div className="flex items-start mt-5 pb-2 comment-editor-container">
          <img
            className="hidden md:block mr-3 rounded"
            src={
              user && user.avatar
                ? user.avatar
                : 'https://static-assets.xue.cn/images/435db86d9a082d12166605b4c1e345fd93b206a5cd425544b5c153afcc61659f'
            }
            width="36px"
            height="36px"
            alt="avatar"
          />
          <div className="w-full -mt-4 relative">
            <TextField
              id="comment-text-field"
              className="po-input po-text-14 textarea"
              placeholder="说点什么..."
              multiline
              fullWidth
              autoFocus={isMobile}
              disabled={!isLogin}
              rows={isPc ? 5 : 3}
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
            <div className="mt-1 md:mt-2"></div>
            <div className="text-right">
              <Button onClick={() => reply()} size="small" isDoing={isDoing} isDone={isDone}>
                发布
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const appendReplyUser = (value: string, name: string) => {
    if (!value) {
      return `@${name} `;
    }
    if (value.startsWith(`@${name} `)) {
      return value;
    }
    const arr = value.split('@');
    const last = (arr.pop() || '').trim();
    if (last === name) {
      return value;
    }
    return `${value}@${name} `;
  };

  const replyTo = (comment: any) => {
    const user = comment.user;
    setReplyingComment(comment);
    setOpenDrawer(true);
    setTimeout(() => {
      const cachedContent = localStorage.getItem(`COMMENT_REPLY:${comment.id}_CONTENT`) || '';
      const replyValue = cachedContent
        ? cachedContent
        : appendReplyUser(drawerReplyValue, user.nickname);
      setDrawerReplyValue(replyValue);
    }, 400);
  };

  const renderFixedCommentEntry = () => {
    return (
      <Fade in={true} timeout={200}>
        <div className="fixed z-10 bottom-0 left-0 w-full py-2 border-t border-gray-300 bg-white flex items-center justify-between">
          <div
            className="flex-1 ml-3 mr-3 rounded-lg bg-gray-200 text-gray-600 py-2 px-3"
            onClick={() => setOpenDrawer(true)}
          >
            说点什么...
          </div>
          <div className="flex items-center py-1 text-gray-99 pr-3">
            {total > 0 && (
              <div
                className="text-xl px-4 relative"
                onClick={() => {
                  const commentSection = document.getElementById('comment-section');
                  if (commentSection) {
                    commentSection.scrollIntoView();
                  }
                }}
              >
                <CommentIcon />
                <span className="absolute top-0 right-0 comment-badge">{total}</span>
              </div>
            )}
            <div
              onClick={() => props.tryVote()}
              className={classNames(
                {
                  'text-blue-400': feedStore.post.voted,
                },
                'text-xl px-4 relative',
              )}
            >
              <ThumbUp />
              {feedStore.post.upVotesCount > 0 && (
                <span className="absolute top-0 right-0 like-badge">
                  {feedStore.post.upVotesCount}
                </span>
              )}
            </div>
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
            `}</style>
          </div>
        </div>
      </Fade>
    );
  };

  const renderMain = () => {
    const hasComments = comments.length > 0;
    return (
      <div className="pb-8 md:pb-0 comment" id="comment-section">
        {hasComments && isMobile && <div className="mt-8 pb-4 border-t border-gray-300" />}
        {!hasComments && isMobile && <div className="mt-10" />}
        {(hasComments || isPc) && (
          <div>
            <div className="text-lg font-bold flex text-gray-700">
              <div className="flex items-center">
                <span className="text-xl mr-2">
                  <CommentIcon />
                </span>{' '}
                全部评论（{total}）
              </div>
            </div>
            <div className="mt-6" />
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
            <div className="w-11/12 md:w-7/12 m-auto md:pt-2 pb-1 md:pb-5">
              {renderEditor({
                user,
                valueState: drawerReplyValue,
                isDoing: isDrawerCreatingComment,
                isCreated: isDrawerCreatedComment,
              })}
            </div>
          </div>
        </DrawerModal>
        {hasComments && (
          <div id="comments" className="overflow-hidden -mx-4">
            <Comments
              user={user}
              comments={comments || []}
              tryDeleteComment={tryDeleteComment}
              replyTo={replyTo}
              upVote={upVote}
              resetVote={resetVote}
              selectedId={selectedCommentId}
            />
          </div>
        )}
        {hasComments && <BottomLine />}
        {isPc && hasComments && comments.length > 3 && (
          <div className="text-center mt-2">
            <span
              className="py-3 text-blue-400 cursor-pointer"
              onClick={() => {
                setOpenDrawer(true);
                stopBodyScroll(true);
                setDrawerReplyValue(localStorage.getItem('COMMENT_CONTENT') || '');
              }}
            >
              说点什么
            </span>
          </div>
        )}

        {isMobile && (openCommentEntry || alwaysShowCommentEntry) && renderFixedCommentEntry()}
      </div>
    );
  };

  return renderMain();
});
