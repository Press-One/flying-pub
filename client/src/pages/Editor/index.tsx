import React from 'react';
import { observer } from 'mobx-react-lite';
import SimpleMDE from 'react-simplemde-editor';
import Button from 'components/Button';
import Loading from 'components/Loading';
import Help from '@material-ui/icons/Help';
import MarkdownCheatSheetDialog from './MarkdownCheatSheetDialog';
import ImgUploader from './ImgUploader';
import CoverUploader from './CoverUploader';
import Fade from '@material-ui/core/Fade';

import { Input, Tooltip } from '@material-ui/core';
import NavigateBefore from '@material-ui/icons/NavigateBefore';
import { CameraAlt } from '@material-ui/icons';

import { useStore } from 'store';
import { sleep, getApiEndpoint, getQuery, setQuery, removeQuery, isPc } from 'utils';
import fileApi from 'apis/file';
import authApi from 'apis/auth';
import config from './config';
import * as EditorStorage from './Storage';
import Img from 'components/Img';

import 'easymde/dist/easymde.min.css';
import './index.scss';

const MAX_CONTENT_LENGTH = 20000;

interface File {
  title: string;
  content: string;
  cover?: string;
  status?: string;
  id?: number;
  invisibility?: boolean;
}

const MainEditor = (props: any = {}) => {
  const { title, handleTitleChange, content, handleContentChange, config } = props;
  return (
    <div className="-mt-2">
      <Input
        autoFocus={!title}
        fullWidth
        required
        placeholder="文章标题"
        value={title}
        onChange={handleTitleChange}
        inputProps={{
          maxLength: 50,
        }}
      />

      <SimpleMDE
        className="p-editor-markdown"
        value={content}
        onChange={handleContentChange}
        options={config}
      />
    </div>
  );
};

export default observer((props: any) => {
  const {
    userStore,
    fileStore,
    snackbarStore,
    settingsStore,
    publishDialogStore,
    confirmDialogStore,
  } = useStore();
  const { settings } = settingsStore;

  if (userStore.isFetched && !userStore.isLogin) {
    setTimeout(() => {
      props.history.push('/login');
    }, 0);
  }

  const id = getQuery('id') ? Number(getQuery('id')) : 0;
  const [file, setFile] = React.useState({
    title: EditorStorage.get(id, 'TITLE') || '',
    content: EditorStorage.get(id, 'CONTENT') || '',
    cover: EditorStorage.get(id, 'COVER') || '',
  } as File);
  const [isFetching, setIsFetching] = React.useState(true);
  const [showImgUploader, setShowImgUploader] = React.useState(false);
  const [showCoverUploader, setShowCoverUploader] = React.useState(false);
  const [showMdCheatSheet, setShowMdCheatSheet] = React.useState(false);
  const [isFetchingPermission, setIsFetchingPermission] = React.useState(false);
  const mdeRef = React.useRef<any>(null);
  const hasPublishPermission = React.useRef(false);
  const isDirtyRef = React.useRef(false);
  const idRef = React.useRef(id);
  const isPublished = file.status === 'published' || file.status === 'pending';

  React.useEffect(() => {
    (async () => {
      try {
        const rId = getQuery('rId');
        if (rId) {
          const file = await fileApi.getFileByRId(rId);
          removeQuery('rId');
          setQuery({
            id: file.id,
          });
          idRef.current = file.id;
        } else {
        }
        const id = getQuery('id');
        if (id) {
          let file = await fileApi.getFile(id);
          file.title = EditorStorage.get(id, 'TITLE') || file.title;
          file.content = EditorStorage.get(id, 'CONTENT') || file.content;
          file.cover = EditorStorage.get(id, 'COVER') || file.cover;
          setFile(file);
        } else {
          const hasCachedContent =
            EditorStorage.get(id, 'TITLE') ||
            EditorStorage.get(id, 'CONTENT') ||
            EditorStorage.get(id, 'COVER');
          if (hasCachedContent) {
            isDirtyRef.current = true;
            setTimeout(() => {
              snackbarStore.show({
                message: '已为你恢复上次未保存的内容...',
                duration: 3000,
              });
            }, 2000);
          }
        }
      } catch (err) {}
      setIsFetching(false);
    })();
  }, [snackbarStore]);

  React.useEffect(() => {
    (async () => {
      setIsFetchingPermission(true);
      try {
        await authApi.checkPermission();
        hasPublishPermission.current = true;
      } catch (err) {
        hasPublishPermission.current = false;
      }
      setIsFetchingPermission(false);
    })();
  }, []);

  const uploadCallback = (imgs: any = []) => {
    if (!mdeRef.current) {
      console.error('mde not exist');
      return;
    }
    if (imgs.length === 0) {
      console.error('imgs is empty');
      return;
    }
    const pos = mdeRef.current.codemirror.getCursor();
    mdeRef.current.codemirror.setSelection(pos, pos);
    const breakLinePrefix = pos.line > 1 || pos.ch > 0 ? '\n' : '';
    mdeRef.current.codemirror.replaceSelection(
      breakLinePrefix +
        imgs
          .map((img: any) => `![${img.filename}](${img.url})`)
          .join('\n'),
    );
    setShowImgUploader(false);
  };

  React.useEffect(() => {
    const toolbar: any = config.toolbar;
    toolbar.splice(-2, 0, {
      name: 'image',
      action: (mde: any) => {
        mdeRef.current = mde;
        setShowImgUploader(true);
      },
      className: 'fa fa-camera',
      title: '插入图片',
    });
    return () => {
      toolbar.splice(-3, 1);
    };
  }, []);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    file.title = event.target.value;
    setFile({ ...file });
    isDirtyRef.current = true;
    EditorStorage.set(idRef.current, 'TITLE', event.target.value);
  };

  const handleContentChange = (value: string) => {
    file.content = value;
    setFile({ ...file });
    isDirtyRef.current = true;
    EditorStorage.set(idRef.current, 'CONTENT', value);
  };

  const handleBack = async () => {
    if (!isPublished && isDirtyRef.current && file.title && file.content) {
      snackbarStore.show({
        message: '正在保存草稿...',
        duration: 5000,
      });
      await handleSave({
        strict: false,
      });
      snackbarStore.close();
    }
    props.history.push('/dashboard');
  };

  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async (options: any) => {
    if (!isDirtyRef.current) {
      return;
    }
    const { strict = true } = options;
    try {
      if (file.title && file.content) {
        isDirtyRef.current = false;
        if (file.content.length > MAX_CONTENT_LENGTH) {
          snackbarStore.show({
            message: '内容最多 2 万字',
            type: 'error',
          });
          return;
        }
        setIsSaving(true);
        let param: File = {
          title: file.title,
          content: file.content,
          cover: file.cover,
        };
        const isUpdating = !!idRef.current;
        if (isUpdating) {
          const res = await fileApi.updateFile(file.id, param);
          setFile(res.updatedFile);
          fileStore.updateFile(res.updatedFile);
          EditorStorage.remove(idRef.current, 'TITLE');
          EditorStorage.remove(idRef.current, 'CONTENT');
          EditorStorage.remove(idRef.current, 'COVER');
        } else {
          const res = await fileApi.createDraft(param);
          setFile(res);
          EditorStorage.remove(idRef.current, 'TITLE');
          EditorStorage.remove(idRef.current, 'CONTENT');
          EditorStorage.remove(idRef.current, 'COVER');
          idRef.current = Number(res.id);
          setQuery({
            id: res.id,
          });
        }
      } else {
        if (!strict) {
          return;
        }
        if (file.title)
          snackbarStore.show({
            message: '内容不能为空',
            type: 'error',
          });
        else
          snackbarStore.show({
            message: '标题不能为空',
            type: 'error',
          });
      }
    } catch (err) {
      if (!strict) {
        return;
      }
      snackbarStore.show({
        message: err.message || '保存草稿失败，请稍后重试',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (isSaving) {
      return;
    }
    if (confirmDialogStore.loading) {
      return;
    }
    try {
      if (file.title && file.content) {
        isDirtyRef.current = false;
        confirmDialogStore.setLoading(true);
        let param: File = {
          title: file.title,
          content: file.content,
          cover: file.cover,
        };
        const isUpdating = !!idRef.current;
        if (isUpdating) {
          const isDraft = file.status === 'draft';
          const isReplacement = !isDraft;
          if (file.invisibility) {
            await fileApi.showFile(file.id);
          }
          const res = await fileApi.updateFile(file.id, param, isDraft);
          if (isDraft) {
            fileStore.updateFile(res.updatedFile);
            publishDialogStore.show(res.updatedFile);
          } else if (isReplacement) {
            snackbarStore.show({
              message: '文章已更新',
              duration: 2000,
            });
          }
        } else {
          const res = await fileApi.createFile(param);
          publishDialogStore.show(res);
        }
        EditorStorage.remove(idRef.current, 'TITLE');
        EditorStorage.remove(idRef.current, 'CONTENT');
        EditorStorage.remove(idRef.current, 'COVER');
        confirmDialogStore.setLoading(false);
        confirmDialogStore.hide();
        props.history.push('/dashboard');
      } else {
        if (file.title)
          snackbarStore.show({
            message: '内容不能为空',
            type: 'error',
          });
        else
          snackbarStore.show({
            message: '标题不能为空',
            type: 'error',
          });
      }
    } catch (err) {
      confirmDialogStore.setLoading(false);
      snackbarStore.show({
        message: err.message || '保存草稿失败，请稍后重试',
        type: 'error',
      });
    }
  };

  const handleClickOpen = async () => {
    if (isFetchingPermission) {
      return;
    }
    const mixinProfile = userStore.profiles.find((v) => v.provider === 'mixin');
    const shouldCheckMixinGroup = (settings['permission.checkingProviders'] || []).includes(
      'mixin',
    );
    if (shouldCheckMixinGroup && !mixinProfile) {
      confirmDialogStore.show({
        contentClassName: 'text-left',
        content: `发布文章之前，请先绑定 ${settings['mixinApp.name']} 的账户，以便我们验证你的学员资格（仅写作课学员能发布文章）`,
        okText: '去绑定',
        ok: async () => {
          confirmDialogStore.setLoading(true);
          window.location.href = `${getApiEndpoint()}/api/auth/mixin/bind?redirect=${encodeURIComponent(
            window.location.href,
          )}`;
        },
      });
      await sleep(500);
      if (!isPublished) {
        handleSave({
          strict: false,
        });
      }
      return;
    }

    if (!hasPublishPermission.current) {
      confirmDialogStore.show({
        contentClassName: 'text-left',
        content: settings['permission.denyText'],
        okText: settings['permission.denyActionText'],
        ok: () => {
          if (isPc) {
            window.open(settings['permission.denyActionLink']);
          } else {
            window.location.href = settings['permission.denyActionLink'];
          }
        },
      });
      await sleep(500);
      if (!isPublished) {
        handleSave({
          strict: false,
        });
      }
      return;
    }

    const rulePostLink = settings['reader.rulePostUrl']
      ? `
      <span className="block text-gray-500 mt-2 text-sm">
        （重要：发布之前请先阅读一下
        <a
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold green-color"
          href={settings['reader.rulePostUrl']}
        >
          发布规则
        </a>
        ）
      </span>
    `
      : '';
    let content = `确定${isPublished ? '更新' : '发布'}文章吗？${rulePostLink}`;
    if (file.invisibility) {
      content = '这篇文章目前已隐藏，更新文章将重新发布，并且对所有人可见，确定更新吗？';
    }
    isDirtyRef.current = false;
    confirmDialogStore.show({
      content,
      okText: isPublished ? '更新' : '发布',
      ok: () => {
        handlePublish();
      },
    });
  };

  // previewIcon
  React.useEffect(() => {
    let button = document.getElementsByClassName('preview');
    if (button[0]) button[0].setAttribute('title', '预览 (Cmd-P)');
  });

  const openMdCheatSheet = () => {
    setShowMdCheatSheet(true);
  };

  const closeMdCheatSheet = () => {
    setShowMdCheatSheet(false);
  };

  return (
    <Fade in={true} timeout={500}>
      <div className="p-editor max-w-1200 mx-auto flex justify-center relative">
        {!isFetching && (
          <div onClick={handleBack}>
            <nav className="p-editor-back flex items-center text-blue-400">
              <NavigateBefore />
              文章
            </nav>
          </div>
        )}

        {(file.title || file.content) && (
          <Fade in={true} timeout={500}>
            <div className="p-editor-save pt-5 flex">
              {!isPublished && (
                <div onClick={handleSave}>
                  <Button outline className="mr-5" isDoing={isSaving} isDone={!isSaving}>
                    保存草稿
                  </Button>
                </div>
              )}

              <div onClick={handleClickOpen}>
                <Button>{isPublished ? '更新文章' : '发布'}</Button>
              </div>
            </div>
          </Fade>
        )}

        {isFetching && (
          <div className="h-screen flex justify-center items-center">
            <div className="-mt-20">
              <Loading />
            </div>
          </div>
        )}

        {!isFetching && (
          <div className="p-editor-input-area relative">
            <MainEditor
              title={file.title}
              handleTitleChange={handleTitleChange}
              content={file.content}
              handleContentChange={handleContentChange}
              config={config}
            />
            <div
              className="text-blue-400 absolute top-0 right-0 mt-24 pt-2 pb-2 px-4 text-14 cursor-pointer"
              onClick={() => setShowCoverUploader(true)}
            >
              <div className="flex items-center pt-1 h-8">
                {file.cover && (
                  <Tooltip
                    title={
                      <div>
                        <Img
                          src={file.cover}
                          resizeWidth={250}
                          useOriginalDefault
                          alt="封面"
                          width="250"
                        />
                      </div>
                    }
                    placement="left"
                  >
                    <div>
                      <Img
                        className="rounded mr-2"
                        width="55px"
                        src={file.cover}
                        resizeWidth={55}
                        alt="封面"
                      />
                    </div>
                  </Tooltip>
                )}
                {!file.cover && (
                  <div
                    className="mr-2 text-xl flex items-center justify-center rounded bg-gray-200"
                    style={{ width: '55px', height: '31px', marginTop: '-2px' }}
                  >
                    <div className="flex items-center mt-1">
                      <CameraAlt />
                    </div>
                  </div>
                )}
                {file.cover ? '更换封面' : '上传封面'}
              </div>
            </div>
            <div className="flex justify-between">
              <div />
              <div
                className="md-ref flex items-center mt-2 help-color cursor-pointer"
                onClick={openMdCheatSheet}
              >
                <div className="flex">
                  <Help className="mr-1" />
                </div>
                Markdown 语法参考
              </div>
            </div>
            <MarkdownCheatSheetDialog open={showMdCheatSheet} cancel={closeMdCheatSheet} />
          </div>
        )}

        <ImgUploader
          open={showImgUploader}
          close={() => setShowImgUploader(false)}
          uploadCallback={uploadCallback}
        />

        <CoverUploader
          open={showCoverUploader}
          close={() => setShowCoverUploader(false)}
          cover={file.cover}
          setCover={(url: string) => {
            file.cover = url;
            EditorStorage.set(idRef.current, 'COVER', url);
            setShowCoverUploader(false);
          }}
        />
      </div>
    </Fade>
  );
});
