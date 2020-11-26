import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import SimpleMDE from 'react-simplemde-editor';
import config from './config';
import ImgUploadModal from './ImgUploadModal';
import { TextField, Tooltip } from '@material-ui/core';
import { EditableFile } from 'apis/file';
import { CameraAlt } from '@material-ui/icons';
import Img from 'components/Img';
import NavigateBefore from '@material-ui/icons/NavigateBefore';
import Button from 'components/Button';
import Fade from '@material-ui/core/Fade';
import { useStore } from 'store';

import 'easymde/dist/easymde.min.css';
import './index.scss';

interface IProps {
  file: EditableFile;
  handleTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleContentChange: (content: string) => void;
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
    showImgUploadModal: false,
  }));
  const mdeRef = React.useRef<any>(null);

  const uploadCallback = (images: any = []) => {
    if (!mdeRef.current) {
      console.error('mde not exist');
      return;
    }
    if (images.length === 0) {
      console.error('images is empty');
      return;
    }
    const pos = mdeRef.current.codemirror.getCursor();
    mdeRef.current.codemirror.setSelection(pos, pos);
    const breakLinePrefix = pos.line > 1 || pos.ch > 0 ? '\n' : '';
    mdeRef.current.codemirror.replaceSelection(
      breakLinePrefix + images.map((img: any) => `![图片](${img.url})`).join('\n'),
    );
    state.showImgUploadModal = false;
    snackbarStore.show({
      delayDuration: 500,
      message: '图片插入成功，点击预览可查看效果',
    });
  };

  React.useEffect(() => {
    const toolbar: any = config.toolbar;
    const imageToolbarItem = toolbar.find((item: any) => item.name === 'image');
    imageToolbarItem.action = (mde: any) => {
      mdeRef.current = mde;
      state.showImgUploadModal = true;
    };
  }, [state]);

  React.useEffect(() => {
    let button = document.getElementsByClassName('preview');
    if (button[0]) button[0].setAttribute('title', '预览 (Cmd-P)');
  });

  return (
    <div className="p-editor max-w-1200 mx-auto flex justify-center relative">
      {!props.isFetching && (
        <div onClick={props.handleBack}>
          <nav className="p-editor-back flex items-center text-blue-400">
            <NavigateBefore />
            文章
          </nav>
        </div>
      )}

      {(props.file.title || props.file.content) && (
        <Fade in={true} timeout={500}>
          <div className="p-editor-save pt-5 flex">
            {!props.isPublished && (
              <div onClick={props.handleSave}>
                <Button outline className="mr-5" isDoing={props.isSaving} isDone={!props.isSaving}>
                  保存草稿
                </Button>
              </div>
            )}

            <div onClick={props.handlePublishClickOpen}>
              <Button>{props.isPublished ? '更新文章' : '发布'}</Button>
            </div>
          </div>
        </Fade>
      )}

      <div className="p-editor-input-area relative">
        <div className="-mt-2">
          <TextField
            autoFocus={!props.file.title}
            fullWidth
            required
            placeholder="标题"
            value={props.file.title}
            onChange={props.handleTitleChange}
            inputProps={{
              maxLength: 50,
            }}
          />

          <SimpleMDE
            className="p-editor-markdown"
            value={props.file.content}
            onChange={props.handleContentChange}
            options={config}
          />

          <ImgUploadModal
            open={state.showImgUploadModal}
            close={() => (state.showImgUploadModal = false)}
            uploadCallback={uploadCallback}
          />

          <div>
            <div
              className="text-blue-400 absolute top-0 right-0 mt-20 pt-10-px pb-2 px-4 text-14 cursor-pointer"
              onClick={props.openCoverUploadModal}
            >
              <div className="flex items-center h-8">
                {props.file.cover && (
                  <Tooltip
                    title={
                      <div>
                        <Img
                          src={props.file.cover}
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
                        src={props.file.cover}
                        resizeWidth={55}
                        alt="封面"
                      />
                    </div>
                  </Tooltip>
                )}
                {!props.file.cover && (
                  <div
                    className="mr-2 text-xl flex items-center justify-center rounded bg-gray-f2"
                    style={{ width: '55px', height: '31px', marginTop: '-2px' }}
                  >
                    <div className="flex items-center mt-1">
                      <CameraAlt />
                    </div>
                  </div>
                )}
                {props.file.cover ? '更换封面' : '上传封面'}
              </div>
            </div>
            {props.wordCount > 0 && (
              <div className="absolute bottom-0 left-0 py-1 px-4 bg-gray-f2 text-gray-9b rounded-full mb-0 text-12 word-count whitespace-no-wrap">
                {props.wordCount} 字
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
