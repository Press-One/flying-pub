import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Loading from 'components/Loading';
import CoverUploadModal from './CoverUploadModal';
import Fade from '@material-ui/core/Fade';
import debounce from 'lodash.debounce';
import { useStore } from 'store';
import { sleep, getApiEndpoint, getQuery, setQuery, removeQuery, isPc, isMobile } from 'utils';
import fileApi, { EditableFile } from 'apis/file';
import * as EditorStorage from './Storage';
import PcEditor from './PcEditor';
import MobileEditor from './MobileEditor';

const MAX_CONTENT_LENGTH = 20000;

export default observer((props: any) => {
  const {
    userStore,
    fileStore,
    snackbarStore,
    settingsStore,
    publishDialogStore,
    confirmDialogStore,
    pathStore,
    preloadStore,
    modalStore,
  } = useStore();
  const { settings } = settingsStore;
  const { prevPath } = pathStore;

  if (userStore.isFetched && !userStore.isLogin) {
    setTimeout(() => {
      props.history.push('/login');
    }, 0);
  }

  const id = getQuery('id') ? Number(getQuery('id')) : 0;
  const state = useLocalStore(() => ({
    file: {
      title: '',
      content: '',
      cover: '',
      mimeType: '',
    } as EditableFile,
    isFetching: true,
    isSaving: false,
    showCoverUploadModal: false,
    wordCount: 0,
    get contentStorageKey() {
      return this.file.mimeType === 'text/markdown' ? `CONTENT` : `EDITOR_JS_CONTENT`;
    },
  }));
  const isDirtyRef = React.useRef(false);
  const idRef = React.useRef<any>(id);
  const isPublished = state.file.status === 'published' || state.file.status === 'pending';

  const goBack = React.useCallback(() => {
    if (isPc) {
      prevPath ? props.history.goBack() : props.history.push('/dashboard');
    } else {
      prevPath ? props.history.goBack() : props.history.push(`/authors/${userStore.user.address}`);
    }
  }, [prevPath, props, userStore]);

  React.useEffect(() => {
    if (isMobile && !state.isFetching && state.file.mimeType !== 'text/markdown') {
      state.isFetching = true;
      confirmDialogStore.show({
        content: '这篇文章用新版编辑器创建的，目前只能在电脑上编辑噢',
        cancelDisabled: true,
        okText: '我知道了',
        ok: async () => {
          confirmDialogStore.hide();
          await sleep(100);
          goBack();
        },
      });
    }
  }, [state.isFetching, state.file.mimeType, goBack, confirmDialogStore]);

  React.useEffect(() => {
    (async () => {
      try {
        const rId = getQuery('rId');
        if (rId) {
          const file = await fileApi.getFileByRId(rId);
          state.file.title = file.title;
          state.file.content = file.content;
          state.file.cover = file.cover;
          state.file.status = file.status;
          state.file.id = file.id;
          state.file.invisibility = file.invisibility;
          removeQuery('rId');
          setQuery({
            id: file.id,
          });
          idRef.current = file.id;
        } else {
        }
        const id = getQuery('id');
        if (id) {
          const file = await fileApi.getFile(id);
          state.file.title = EditorStorage.get(id, 'TITLE') || file.title;
          state.file.content = EditorStorage.get(id, state.contentStorageKey) || file.content;
          state.file.cover = EditorStorage.get(id, 'COVER') || file.cover;
          state.file.mimeType = EditorStorage.get(id, 'MIME_TYPE') || file.mimeType;
          state.file.status = file.status;
          state.file.id = file.id;
          state.file.invisibility = file.invisibility;
        } else {
          const hasCachedContent =
            EditorStorage.get(id, 'TITLE') ||
            EditorStorage.get(id, state.contentStorageKey) ||
            EditorStorage.get(id, 'COVER');
          state.file.title = EditorStorage.get(id, 'TITLE') || '';
          state.file.content = EditorStorage.get(id, state.contentStorageKey) || '';
          state.file.cover = EditorStorage.get(id, 'COVER') || '';
          state.file.mimeType = EditorStorage.get(id, 'MIME_TYPE') || 'text/markdown';
          if (hasCachedContent) {
            isDirtyRef.current = true;
          }
        }
      } catch (err) {}
      state.isFetching = false;
    })();
  }, [snackbarStore, state]);

  const wordCountDebounce = React.useCallback(
    debounce((content: string) => {
      state.wordCount = (content || '').length;
    }, 250),
    [],
  );

  React.useEffect(() => {
    (async () => {
      wordCountDebounce(state.file.content);
    })();
  }, [state.file.content, wordCountDebounce]);

  React.useEffect(() => {
    if (!state.isFetching && getQuery('action') === 'triggerPreview') {
      const previewButton: any = document.querySelector('.preview');
      console.log({ previewButton });
      if (previewButton) {
        previewButton.click();
      }
      removeQuery('action');
    }
  }, [state.isFetching]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    state.file.title = event.target.value;
    isDirtyRef.current = true;
    EditorStorage.set(idRef.current, 'TITLE', event.target.value);
  };

  const handleContentChange = (value: string) => {
    state.file.content = value;
    isDirtyRef.current = true;
    EditorStorage.set(idRef.current, state.contentStorageKey, value);
  };

  const handleCoverChange = (url: string) => {
    state.file.cover = url;
    isDirtyRef.current = true;
    EditorStorage.set(idRef.current, 'COVER', url);
  };

  const toggleMimeType = async () => {
    modalStore.openPageLoading();
    if (state.file.mimeType === 'text/markdown') {
      state.file.mimeType = 'application/json';
    } else {
      state.file.mimeType = 'text/markdown';
    }
    EditorStorage.set(idRef.current, 'MIME_TYPE', state.file.mimeType);
    state.file.content = EditorStorage.get(idRef.current, state.contentStorageKey) || '';
    await sleep(1000);
    modalStore.closePageLoading();
  };

  const cleanStorageData = () => {
    EditorStorage.remove(idRef.current, 'TITLE');
    EditorStorage.remove(idRef.current, 'CONTENT');
    EditorStorage.remove(idRef.current, 'EDITOR_JS_CONTENT');
    EditorStorage.remove(idRef.current, 'COVER');
  };

  const handleSave = async (options: any) => {
    if (!isDirtyRef.current) {
      return;
    }
    const { strict = true } = options;
    try {
      if (state.file.title && state.file.content) {
        isDirtyRef.current = false;
        if (state.file.content.length > MAX_CONTENT_LENGTH) {
          snackbarStore.show({
            message: '内容最多 2 万字',
            type: 'error',
          });
          return;
        }
        state.isSaving = true;
        let param: EditableFile = {
          title: state.file.title,
          content: state.file.content,
          cover: state.file.cover,
          mimeType: state.file.mimeType,
        };
        const isUpdating = !!idRef.current;
        if (isUpdating) {
          const res = await fileApi.updateFile(state.file.id, param);
          state.file.title = res.updatedFile.title;
          state.file.content = res.updatedFile.content;
          state.file.cover = res.updatedFile.cover;
          fileStore.updateFile(res.updatedFile);
          cleanStorageData();
        } else {
          const res = await fileApi.createDraft(param);
          state.file.title = res.title;
          state.file.content = res.content;
          state.file.cover = res.cover;
          cleanStorageData();
          idRef.current = Number(res.id);
          setQuery({
            id: res.id,
          });
        }
      } else {
        if (!strict) {
          return;
        }
        if (state.file.title)
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
        message: '貌似出错了，请等会再试一试呢 ~',
        type: 'error',
      });
    } finally {
      state.isSaving = false;
    }
  };

  const handlePublish = async () => {
    if (state.isSaving) {
      return;
    }
    if (confirmDialogStore.loading) {
      return;
    }
    try {
      if (state.file.title && state.file.content) {
        isDirtyRef.current = false;
        confirmDialogStore.setLoading(true);
        let param: EditableFile = {
          title: state.file.title,
          content: state.file.content,
          cover: state.file.cover,
          mimeType: state.file.mimeType,
        };
        const isUpdating = !!idRef.current;
        let rId = '';
        if (isUpdating) {
          const isDraft = state.file.status === 'draft';
          const isReplacement = !isDraft;
          if (state.file.invisibility) {
            await fileApi.showFile(state.file.id);
          }
          const res = await fileApi.updateFile(state.file.id, param, isDraft);
          if (isDraft) {
            fileStore.updateFile(res.updatedFile);
            publishDialogStore.show(res.updatedFile);
          } else if (isReplacement) {
            snackbarStore.show({
              message: '文章已更新',
              duration: 2000,
            });
          }
          rId = res.updatedFile.rId;
        } else {
          const res = await fileApi.createFile(param);
          publishDialogStore.show(res);
          rId = res.rId;
        }
        EditorStorage.remove(idRef.current, 'TITLE');
        EditorStorage.remove(idRef.current, state.contentStorageKey);
        EditorStorage.remove(idRef.current, 'COVER');
        confirmDialogStore.setLoading(false);
        confirmDialogStore.hide();
        props.history.push(isPc ? '/dashboard' : `posts/${rId}`);
      } else {
        if (state.file.title)
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
        message: '貌似出错了，请等会再试一试呢 ~',
        type: 'error',
      });
    }
  };

  const handlePublishClickOpen = async () => {
    if (!preloadStore.ready) {
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

    if (!userStore.canPublish) {
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
    if (state.file.invisibility) {
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

  const handleBack = async () => {
    if (!isPublished && isDirtyRef.current && state.file.title && state.file.content) {
      confirmDialogStore.show({
        content: '要保存这份草稿吗？',
        cancelText: '不保存',
        okText: '保存',
        cancel: async () => {
          confirmDialogStore.hide();
          await sleep(100);
          cleanStorageData();
          goBack();
        },
        ok: async () => {
          confirmDialogStore.setLoading(true);
          await handleSave({
            strict: false,
          });
          confirmDialogStore.setLoading(false);
          confirmDialogStore.hide();
          await sleep(100);
          goBack();
          if (isMobile) {
            await sleep(350);
            snackbarStore.show({
              message: '草稿已保存，点击右上角的菜单可进入草稿箱',
              duration: 2500,
            });
          }
        },
      });
    } else {
      goBack();
    }
  };

  return (
    <Fade in={true} timeout={500}>
      <div>
        {state.isFetching && (
          <div className="h-screen flex justify-center items-center">
            <div className="-mt-20">
              <Loading />
            </div>
          </div>
        )}

        {!state.isFetching && (
          <div>
            {isPc && (
              <PcEditor
                file={state.file}
                handleTitleChange={handleTitleChange}
                handleContentChange={handleContentChange}
                openCoverUploadModal={() => (state.showCoverUploadModal = true)}
                wordCount={state.wordCount}
                handlePublishClickOpen={handlePublishClickOpen}
                handleBack={handleBack}
                isFetching={state.isFetching}
                isSaving={state.isSaving}
                isPublished={isPublished}
                isUpdating={!!idRef.current}
                handleSave={handleSave}
                toggleMimeType={toggleMimeType}
              />
            )}

            {isMobile && (
              <MobileEditor
                file={state.file}
                handleTitleChange={handleTitleChange}
                handleContentChange={handleContentChange}
                openCoverUploadModal={() => (state.showCoverUploadModal = true)}
                wordCount={state.wordCount}
                handlePublishClickOpen={handlePublishClickOpen}
                handleBack={handleBack}
                isFetching={state.isFetching}
                isSaving={state.isSaving}
                isPublished={isPublished}
                handleSave={handleSave}
              />
            )}
          </div>
        )}

        <CoverUploadModal
          open={state.showCoverUploadModal}
          close={() => (state.showCoverUploadModal = false)}
          cover={state.file.cover}
          setCover={handleCoverChange}
        />
      </div>
    </Fade>
  );
});
