import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { TextField } from '@material-ui/core';
import { EditableFile } from 'apis/file';
import autosize from 'autosize';
import { scrollToHere, sleep, getViewport } from 'utils';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';
import { faImage, faEye } from '@fortawesome/free-regular-svg-icons';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'components/Button';
import ImgUploadModal from './ImgUploadModal';
import DrawerModal from 'components/DrawerModal';
import marked from 'marked';
import { useStore } from 'store';

interface IProps {
  file: EditableFile;
  handleTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleContentChange: (file: string) => void;
  openCoverUploadModal: () => void;
  handleBack: () => void;
  handleSave: (options: any) => void;
  handlePublishClickOpen: () => void;
  isFetching: boolean;
  isSaving: boolean;
  isPublished: boolean;
  wordCount: number;
}

export default observer((props: IProps) => {
  const { snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    selectionStart: 0,
    autoSized: false,
    visualViewportHeight: getViewport().height,
    alwaysShowToolbar: false,
    showToolbar: true,
    toolbarBottom: 0 as any,
    toolbarTop: 0 as any,
    showImgUploadModal: false,
    showPreviewModal: false,
    editorHeight: getViewport().height - 48 - 42,
    typing: false,
  }));
  const textareaRef = React.useRef<any>(null);

  const getIsKeyboardActive = () => getViewport().height + 150 < (window as any).outerHeight;

  const tryAdjustToolbarPosition = React.useCallback(() => {
    if (getIsKeyboardActive()) {
      state.editorHeight = getViewport().height - 42;
      state.typing = true;
    } else {
      state.editorHeight = getViewport().height - 48 - 42;
      state.typing = false;
    }
    setTimeout(() => {
      scrollToHere(0);
    }, 0);
  }, [state]);

  React.useEffect(() => {
    document.title = '';
  }, []);

  React.useEffect(() => {
    document.body.style.minHeight = '100vh';
    return () => {
      document.body.style.minHeight = '110vh';
    };
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => {
      state.visualViewportHeight = getViewport().height;
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, [state]);

  React.useEffect(() => {
    tryAdjustToolbarPosition();
  }, [state, state.visualViewportHeight, tryAdjustToolbarPosition]);

  React.useEffect(() => {
    (async () => {
      const textarea = document.querySelector('.content-input textarea');
      if (textarea) {
        autosize(textarea);
      }
    })();
  }, [props, state, tryAdjustToolbarPosition]);

  const insertText = (text: string) => {
    const insertedContent =
      props.file.content.slice(0, state.selectionStart) +
      text +
      props.file.content.slice(state.selectionStart);
    textareaRef.current.selectionEnd = state.selectionStart + text.length;
    textareaRef.current.focus();
    props.handleContentChange(insertedContent);
  };

  const uploadCallback = (images: any = []) => {
    if (images.length === 0) {
      console.error('images is empty');
      return;
    }
    const breakLinePrefix = state.selectionStart > 0 ? '\n' : '';
    insertText(breakLinePrefix + images.map((img: any) => `![图片](${img.url})`).join('\n') + '\n');
    state.showImgUploadModal = false;
    snackbarStore.show({
      delayDuration: 500,
      message: '图片插入成功，点击预览可查看效果',
    });
  };

  const Header = () => (
    <div>
      <div className="top-0 left-0 w-screen bg-white z-10">
        <div className="pt-1-px" />
        <div className="flex justify-between items-center py-1 px-3 h-12">
          <div className="flex items-center">
            <div className="flex items-center text-xl text-gray-700 p-2" onClick={props.handleBack}>
              <ArrowBackIos />
            </div>
          </div>
          <Button size="small" onClick={props.handlePublishClickOpen}>
            发布
          </Button>
        </div>
      </div>
    </div>
  );

  const Toolbar = () => {
    return (
      <div
        className="z-10 bg-white w-screen px-4 box-border"
        style={{
          left: 0,
          bottom: state.toolbarBottom,
          top: state.toolbarTop,
        }}
      >
        <div className="flex items-center justify-between text-26 text-gray-bd">
          <div>
            {props.wordCount > 0 && (
              <div className="py-1 px-4 bg-gray-f2 text-gray-9b rounded-full text-12 whitespace-no-wrap">
                {props.wordCount} 字
              </div>
            )}
          </div>
          <div className="flex items-center">
            <div
              className="flex items-center px-3 py-2 text-24"
              onClick={async () => {
                await sleep(getIsKeyboardActive() ? 300 : 0);
                props.openCoverUploadModal();
              }}
            >
              <FontAwesomeIcon icon={faCog} />
            </div>
            <div
              className="flex items-center px-3 py-2"
              onClick={async () => {
                await sleep(getIsKeyboardActive() ? 300 : 0);
                state.showImgUploadModal = true;
              }}
            >
              <FontAwesomeIcon icon={faImage} />
            </div>
            <div
              className="flex items-center px-3 py-2"
              onClick={async () => {
                await sleep(getIsKeyboardActive() ? 300 : 0);
                state.showPreviewModal = true;
              }}
            >
              <FontAwesomeIcon icon={faEye} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {!state.typing && Header()}
      <div
        className="mobile-editor px-5 pt-3 box-border overflow-y-auto"
        style={{
          height: state.editorHeight,
        }}
        onClick={(e: any) => {
          const cursorY = e.clientY - 53 + 42 + 20;
          const element: any = document.querySelector('.mobile-editor');
          const elementScrollTop = element.scrollTop;
          setTimeout(() => {
            if (cursorY > getViewport().height) {
              const scrollTop = elementScrollTop + (cursorY - getViewport().height) + 100;
              element.scrollTop = scrollTop;
            }
          }, 200);
        }}
      >
        <TextField
          fullWidth
          required
          placeholder="标题"
          value={props.file.title}
          onChange={props.handleTitleChange}
          inputProps={{
            maxLength: 50,
          }}
        />

        <div className="mt-2">
          <TextField
            className="w-full content-input box-border"
            value={props.file.content}
            onChange={(e: any) => {
              props.handleContentChange(e.target.value);
            }}
            onClick={(e: any) => {
              state.selectionStart = e.target.selectionStart;
            }}
            margin="none"
            rows={3}
            multiline
            variant="outlined"
            inputProps={{
              placeholder: '开始你的创作...',
              ref: textareaRef,
              onKeyUp: (e: any) => {
                state.selectionStart = e.target.selectionStart;
              },
            }}
          />
        </div>
      </div>
      {state.showToolbar && Toolbar()}

      <ImgUploadModal
        open={state.showImgUploadModal}
        close={() => (state.showImgUploadModal = false)}
        uploadCallback={uploadCallback}
      />

      <DrawerModal
        open={state.showPreviewModal}
        onClose={() => {
          state.showPreviewModal = false;
        }}
      >
        <div className="bg-white rounded-12 text-gray-4a preview-modal overflow-y-auto">
          <div className="px-5 py-4 leading-none text-16 border-b border-gray-d8 border-opacity-75 text-gray-4a flex justify-between items-center">
            预览
          </div>
          <div className="p-5">
            <div className="text-xl text-gray-900 font-bold">{props.file.title || '标题'}</div>
            <div
              className="mt-3 text-base markdown-body pb-6 px-2 overflow-hidden"
              dangerouslySetInnerHTML={{ __html: marked.parse(props.file.content || '正文') }}
            />
          </div>
        </div>
      </DrawerModal>

      <style jsx>{`
        .preview-modal {
          height: 95vh;
        }
        .markdown-body {
          color: #333;
          font-size: 16px;
          line-height: 1.65;
          font-family: -apple-system-font, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC',
            'Hiragino Sans GB', 'Microsoft YaHei UI', 'Microsoft YaHei', Arial, sans-serif;
        }
      `}</style>
    </div>
  );
});
