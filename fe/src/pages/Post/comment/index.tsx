import React from 'react';
import { observer } from 'mobx-react-lite';
import TextField from '@material-ui/core/TextField';
import CommentIcon from '@material-ui/icons/Comment';
import ConfirmDialog from 'components/ConfirmDialog';
import Button from 'components/Button';
import ButtonProgress from 'components/ButtonProgress';
import Loading from 'components/Loading';
import DrawerModal from 'components/DrawerModal';
import Fade from '@material-ui/core/Fade';
import debounce from 'lodash.debounce';
import Comments from './comments';
import { useStore } from 'store';
import { sleep, stopBodyScroll, isMobile, isPc } from 'utils';
import CommentApi from './api';
import Api from 'api';

interface IProps {
  fileRId: number;
  alwaysShowCommentEntry: boolean;
}

export default observer((props: IProps) => {
  const { commentStore, snackbarStore, userStore, modalStore } = useStore();
  const { total, comments, isFetched } = commentStore;
  const { user, isLogin } = userStore;

  const [value, setValue] = React.useState('');
  const [drawerReplyValue, setDrawerReplyValue] = React.useState('');
  const [isCreatingComment, setIsCreatingComment] = React.useState(false);
  const [isCreatedComment, setIsCreatedComment] = React.useState(false);
  const [isDrawerCreatingComment, setIsDrawerCreatingComment] = React.useState(false);
  const [isDrawerCreatedComment, setIsDrawerCreatedComment] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [deleteCommentId, setDeleteCommentId] = React.useState(0);
  const [openDrawer, setOpenDrawer] = React.useState(false);
  const [openCommentEntry, setOpenCommentEntry] = React.useState(false);
  const [isVoting, setIsVoting] = React.useState(false);
  const { alwaysShowCommentEntry } = props;

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
    const fetchComments = async () => {
      const { fileRId } = props;
      let res;
      const pagination = {
        offset: 0,
        limit: '1000',
      };
      res = await CommentApi.list(fileRId, pagination);
      commentStore.setTotal(res['total']);
      commentStore.setComments(res['comments']);
      commentStore.setIsFetched(true);
    };
    fetchComments();
  }, [commentStore, props]);

  const reply = async () => {
    if (isCreatingComment || isDrawerCreatingComment) {
      return;
    }
    if (!isLogin) {
      modalStore.openLogin();
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
        objectId: props.fileRId,
        objectType: 'post',
      };
      const newComment = await CommentApi.create(comment);
      await sleep(500);
      commentStore.addComment(newComment);
      openDrawer ? setIsDrawerCreatedComment(true) : setIsCreatedComment(true);
      if (openDrawer) {
        setDrawerReplyValue('');
        setOpenDrawer(false);
        stopBodyScroll(false);
      } else {
        setValue('');
      }
      const scrollElement = document.scrollingElement || document.documentElement;
      try {
        scrollElement.scrollTo({
          top: 9999,
          behavior: 'smooth',
        });
      } catch (err) {
        scrollElement.scrollTop = 9999;
      }
    } catch (e) {
      snackbarStore.show({
        message: e.message || '发布失败，请稍后重试',
        type: 'error',
      });
    } finally {
      openDrawer ? setIsDrawerCreatingComment(false) : setIsCreatingComment(false);
    }
  };

  const upVote = async (commentId: number) => {
    if (isVoting) {
      return;
    }
    if (!isLogin) {
      modalStore.openLogin();
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
    if (!isLogin) {
      modalStore.openLogin();
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
    setDeleteCommentId(commentId);
    setShowConfirmDialog(true);
  };

  const deleteComment = async (commentId: number) => {
    try {
      await CommentApi.delete(commentId);
      commentStore.removeComment(commentId);
      setShowConfirmDialog(false);
    } catch (e) {
      snackbarStore.show({
        message: '删除失败，请稍后重试',
        type: 'error',
      });
    }
  };

  const handleEditorChange = (event: any) => {
    openDrawer ? setDrawerReplyValue(event.target.value) : setValue(event.target.value);
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
            src={user && user.avatar ? user.avatar : 'https://static.press.one/pub/avatar.png'}
            width="36px"
            height="36px"
            alt="avatar"
          />
          <div className="w-full -mt-4 relative">
            <TextField
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
            <style jsx global>{`
              .textarea .MuiOutlinedInput-input {
                padding: 0 !important;
              }
            `}</style>
            {!isLogin && (
              <div className="text-gray-600 absolute top-0 left-0 mt-5 ml-1 bg-white p-3">
                评论之前请先
                <span className="text-blue-400 cursor-pointer" onClick={modalStore.openLogin}>
                  登陆
                </span>
              </div>
            )}
            <div className="mt-1 md:mt-2"></div>
            <div className="text-right">
              <Button onClick={() => reply()} small={isMobile}>
                发布
                <ButtonProgress isDoing={isDoing} isDone={isDone} />
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
    const arr = value.split('@');
    const last = (arr.pop() || '').trim();
    if (last === name) {
      return value;
    }
    return `${value}@${name} `;
  };

  const replyTo = (user: any) => {
    if (!isLogin) {
      modalStore.openLogin();
      return;
    }
    setOpenDrawer(true);
    setTimeout(() => {
      setDrawerReplyValue(appendReplyUser(drawerReplyValue, user.name));
    }, 400);
  };

  const renderLoading = () => {
    return (
      <div className="py-20">
        <Loading />
      </div>
    );
  };

  const renderDeleteConfirm = (showConfirmDialog: boolean, deleteCommentId: number) => {
    return (
      <ConfirmDialog
        content="确定删除这条评论？"
        open={showConfirmDialog}
        cancelText="取消"
        cancel={() => {
          setShowConfirmDialog(false);
        }}
        ok={() => deleteComment(deleteCommentId)}
      />
    );
  };

  const renderFixedCommentEntry = () => {
    return (
      <Fade in={true} timeout={200}>
        <div
          className="fixed bottom-0 left-0 w-full py-2 px-3 border-t border-gray-300 bg-white"
          onClick={() => setOpenDrawer(true)}
        >
          <div className="rounded-lg bg-gray-200 text-gray-600 py-2 px-3">说点什么...</div>
        </div>
      </Fade>
    );
  };

  const renderMain = () => {
    const hasComments = comments.length > 0;
    return (
      <div className="pb-8 md:pb-0 comment">
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
          <Comments
            user={user}
            comments={comments || []}
            tryDeleteComment={tryDeleteComment}
            replyTo={replyTo}
            upVote={upVote}
            resetVote={resetVote}
          />
        )}
        {hasComments && (
          <div className="mt-5 md:mt-10 text-gray-500 flex items-center justify-center">
            <span className="h-px bg-gray-300 w-16 mr-2"></span>
            <span className="text-gray-300 text-lg">·</span>
            <span className="h-px bg-gray-300 w-16 ml-2"></span>
          </div>
        )}
        {isPc && hasComments && comments.length > 3 && (
          <div className="text-center mt-2">
            <span
              className="py-3 text-blue-400 cursor-pointer"
              onClick={() => {
                setOpenDrawer(true);
                stopBodyScroll(true);
                setDrawerReplyValue('');
              }}
            >
              说点什么
            </span>
          </div>
        )}

        {isMobile && (openCommentEntry || alwaysShowCommentEntry) && renderFixedCommentEntry()}

        {renderDeleteConfirm(showConfirmDialog, deleteCommentId)}
      </div>
    );
  };

  return isFetched ? renderMain() : renderLoading();
});
