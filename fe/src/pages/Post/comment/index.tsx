import React from 'react';
import { observer } from 'mobx-react-lite';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';
import CommentIcon from '@material-ui/icons/Comment';
import ConfirmDialog from 'components/ConfirmDialog';
import Button from 'components/Button';
import ButtonProgress from 'components/ButtonProgress';
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
  const { total, comments } = commentStore;
  const { user, isLogin } = userStore;

  const [value, setValue] = React.useState('');
  const [replyValue, setReplyValue] = React.useState('');
  const [isFetching, setIsFetching] = React.useState(false);
  const [isCreatingComment, setIsCreatingComment] = React.useState(false);
  const [isCreatedComment, setIsCreatedComment] = React.useState(false);
  const [isReplyingComment, setIsReplyingComment] = React.useState(false);
  const [isRepliedComment, setIsRepliedComment] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [deleteCommentId, setDeleteCommentId] = React.useState(0);
  const [openDrawer, setOpenDrawer] = React.useState(false);

  React.useEffect(() => {
    const fetchComments = async () => {
      const { fileRId } = props;
      setIsFetching(true);
      let res;
      const pagination = {
        offset: 0,
        limit: '1000',
      };
      res = await CommentApi.list(fileRId, pagination);
      setIsFetching(false);
      commentStore.setTotal(res['total']);
      commentStore.setComments(res['comments']);
    };
    fetchComments();
  }, [commentStore, props]);

  const reply = async () => {
    const _value = ((openDrawer ? replyValue : value) || '').trim();
    if (!_value) {
      snackbarStore.show({
        message: '请输入回复内容',
        type: 'error',
      });
      return;
    }
    forceBlur();
    openDrawer ? setIsReplyingComment(true) : setIsCreatingComment(true);
    openDrawer ? setIsRepliedComment(false) : setIsCreatedComment(false);
    try {
      const comment = {
        content: value,
        objectId: props.fileRId,
        objectType: 'post',
      };
      const newComment = await CommentApi.create(comment);
      commentStore.addComment(newComment);
      openDrawer ? setIsRepliedComment(true) : setIsCreatedComment(true);
      if (openDrawer) {
        setReplyValue('');
        setOpenDrawer(false);
      } else {
        setValue('');
      }
      snackbarStore.show({
        message: '评论成功',
      });
    } catch (e) {
      console.log(` ------------- e ---------------`, e);
      snackbarStore.show({
        message: '回复失败，请稍后重试',
        type: 'error',
      });
    } finally {
      openDrawer ? setIsReplyingComment(false) : setIsCreatingComment(false);
    }
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
    openDrawer ? setReplyValue(event.target.value) : setValue(event.target.value);
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
              autoFocus
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
      setReplyValue(appendReplyUser(replyValue, user.name));
    }, 400);
  };

  const renderBigLoading = () => {
    return (
      <div className="py-20 text-center default-text-color">
        <CircularProgress size={40} />
      </div>
    );
  };

  const renderDeleteConfirm = (showConfirmDialog: boolean, deleteCommentId: number) => {
    return (
      <ConfirmDialog
        content="确定删除这条评论？"
        open={showConfirmDialog}
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
            setReplyValue('');
            setOpenDrawer(false);
          }}
        >
          <div className="w-7/12 m-auto pt-2 pb-5">
            {renderEditor({
              user,
              valueState: replyValue,
              isDoing: isReplyingComment,
              isCreated: isRepliedComment,
            })}
          </div>
        </Drawer>
        {hasComments ? (
          <Comments
            user={user}
            comments={comments || []}
            tryDeleteComment={tryDeleteComment}
            replyTo={replyTo}
          />
        ) : (
          renderEmptyComment()
        )}
        {hasComments && <div className="mt-12 text-center text-gray-500">-- 没有更多啦 --</div>}
        {renderDeleteConfirm(showConfirmDialog, deleteCommentId)}
      </div>
    );
  };

  return isFetching ? renderBigLoading() : renderMain();
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
