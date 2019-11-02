import React from 'react';
import { observer } from 'mobx-react-lite';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';
import CommentIcon from '@material-ui/icons/Comment';
import ConfirmDialog from 'components/ConfirmDialog';
import Button from 'components/Button';
import ButtonProgress from 'components/ButtonProgress';
import Loading from 'components/Loading';
import Drawer from '@material-ui/core/Drawer';
import Comments from './comments';
import { useStore } from 'store';
import CommentApi from './api';

interface IProps {
  fileRId: number;
  toLogin: any;
}

export default observer((props: IProps) => {
  const { commentStore, snackbarStore, userStore } = useStore();
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
    const _value = ((openDrawer ? drawerReplyValue : value) || '').trim();
    if (!_value) {
      snackbarStore.show({
        message: '请输入回复内容',
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
      commentStore.addComment(newComment);
      openDrawer ? setIsDrawerCreatedComment(true) : setIsCreatedComment(true);
      if (openDrawer) {
        setDrawerReplyValue('');
        setOpenDrawer(false);
      } else {
        setValue('');
      }
      const scrollElement = document.scrollingElement || document.documentElement;
      scrollElement.scrollTo({
        top: 9999,
        behavior: 'smooth',
      });
    } catch (e) {
      console.log(` ------------- e ---------------`, e);
      snackbarStore.show({
        message: '回复失败，请稍后重试',
        type: 'error',
      });
    } finally {
      openDrawer ? setIsDrawerCreatingComment(false) : setIsCreatingComment(false);
    }
  };

  const upVote = async (commentId: number) => {
    try {
      const comment = await CommentApi.createVote({
        commentId,
        type: 'UP',
      });
      commentStore.updateComment(comment);
    } catch (err) {}
  };

  const resetVote = async (commentId: number) => {
    try {
      const comment = await CommentApi.updateVote({
        commentId,
        type: 'RESET',
      });
      commentStore.updateComment(comment);
    } catch (err) {}
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

  const renderEmptyComment = () => {
    return (
      <div className="my-10 text-center">
        <div className="text-gray-700 mb-3">还没有人发表评论</div>
      </div>
    );
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
            className="mr-3"
            src={user ? user.avatar : 'https://static.press.one/pub/avatar.png'}
            width="36px"
            height="36px"
            alt="avatar"
          />
          <div className="w-full -mt-4">
            <TextField
              className="po-input po-text-14"
              placeholder="写下你的评论..."
              multiline
              fullWidth
              rows="5"
              value={valueState}
              onChange={handleEditorChange}
              margin="normal"
              variant="outlined"
            />
            <div className="mt-2"></div>
            <div className="text-right">
              <Button onClick={() => reply()}>
                回复
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
      props.toLogin();
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

  const renderMain = () => {
    const hasComments = comments.length > 0;
    return (
      <div className="mt-10">
        <div className="text-lg font-bold flex text-gray-700">
          <div className="flex items-center">
            <span className="text-xl mr-2">
              <CommentIcon />
            </span>{' '}
            全部评论（{total}）
          </div>
        </div>
        <div className="mt-6" />
        {renderEditor({
          user,
          valueState: value,
          isDoing: isCreatingComment,
          isCreated: isCreatedComment,
        })}
        <div className="mt-8" />
        <Drawer
          anchor="bottom"
          open={openDrawer}
          onClose={() => {
            setDrawerReplyValue('');
            setOpenDrawer(false);
          }}
        >
          <div className="container">
            <div className="w-7/12 m-auto pt-2 pb-5">
              {renderEditor({
                user,
                valueState: drawerReplyValue,
                isDoing: isDrawerCreatingComment,
                isCreated: isDrawerCreatedComment,
              })}
            </div>
          </div>
        </Drawer>
        {hasComments ? (
          <Comments
            user={user}
            comments={comments || []}
            tryDeleteComment={tryDeleteComment}
            replyTo={replyTo}
            upVote={upVote}
            resetVote={resetVote}
          />
        ) : (
          renderEmptyComment()
        )}
        {hasComments && <div className="mt-12 text-gray-500 text-center">-- 没有更多啦--</div>}
        {hasComments && comments.length > 3 && (
          <div className="text-center mt-2">
            <span
              className="py-3 text-blue-400 cursor-pointer"
              onClick={() => {
                setOpenDrawer(true);
                setDrawerReplyValue('');
              }}
            >
              我想发表评论
            </span>
          </div>
        )}

        {renderDeleteConfirm(showConfirmDialog, deleteCommentId)}
      </div>
    );
  };

  return isFetched ? renderMain() : renderLoading();
});

// bindOpenLinkInNewWindow() {
//   ref.current.addEventListener('click', (e: any) => {
//     if (e.target.tagName === 'A') {
//       const href = e.target.getAttribute('href');
//       if (href) {
//         window.open(href);
//         e.preventDefault();
//       }
//     }
//   });
// }
