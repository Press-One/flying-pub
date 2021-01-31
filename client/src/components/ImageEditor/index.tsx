import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import AvatarEditor from 'react-avatar-editor';
import Button from 'components/Button';
import { Edit, ZoomIn, ZoomOut, CameraAlt } from '@material-ui/icons';
import { Dialog, Slider, withStyles } from '@material-ui/core';
import DrawerModal from 'components/DrawerModal';
import { isMobile, isPc, MimeType, limitImageWidth, sleep } from 'utils';
import { transferResourceToCDN } from 'utils/transfer';
import Menu from './Menu';
import ImageLibModal from './ImageLibModal';
import Api from 'api';
import classNames from 'classnames';

import './index.sass';

export default observer((props: any) => {
  const state = useLocalStore(() => ({
    showMenu: false,
    showImageLib: false,
    externalImageUrl: '',
    mimeType: '',
    isUploadingOriginImage: false,

    avatar: '',
    nickname: '',
    bio: '',
    submitting: false,
    submitDone: false,

    avatarTemp: '',
    avatarDialogOpen: false,
    avatarLoading: false,
    scale: 1,
  }));

  const width: any = React.useMemo(() => props.width || 120, [props.width]);
  const ratio: any = React.useMemo(() => props.ratio || 1, [props.ratio]);
  const placeholderScale: any = React.useMemo(
    () => (props.placeholderWidth ? props.placeholderWidth / props.width : 1),
    [props.placeholderWidth, props.width],
  );
  const editorPlaceholderScale: any = React.useMemo(
    () => (props.editorPlaceholderWidth ? props.editorPlaceholderWidth / props.width : 1),
    [props.editorPlaceholderWidth, props.width],
  );

  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const avatarEditorRef = React.useRef<AvatarEditor>(null);

  React.useEffect(() => {
    if (props.hidden) {
      state.showMenu = props.open;
    }
  }, [state, props.hidden, props.open]);

  React.useEffect(() => {
    if (!state.showMenu) {
      (async () => {
        await sleep(200);
        state.isUploadingOriginImage = false;
      })();
    }
  }, [state, state.showMenu]);

  const handleAvatarInputChange = () => {
    const file = avatarInputRef.current!.files![0];
    state.mimeType = file.type;
    avatarInputRef.current!.value = '';
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.addEventListener('load', async () => {
        if (props.useOriginImage) {
          state.isUploadingOriginImage = true;
          const newFile: any = await limitImageWidth(750, file);
          const formData = new FormData();
          formData.append('file', newFile);
          formData.append('file_name', newFile.name);
          const res = await Api.uploadImage(formData);
          const url = (await res.json()).url;
          props.getImageUrl(url);
          await sleep(200);
          props.close && props.close(true);
        } else {
          state.avatarTemp = reader.result as string;
          state.avatarDialogOpen = true;
        }
      });
    }
  };

  const handleAvatarSubmit = async () => {
    if (state.avatarLoading) {
      return;
    }

    state.avatarLoading = true;

    const imageElement = new Image();
    if (state.externalImageUrl) {
      imageElement.setAttribute('crossorigin', 'anonymous');
      imageElement.src = state.externalImageUrl;
    } else {
      imageElement.src = state.avatarTemp;
    }

    if (state.externalImageUrl) {
      await new Promise((resolve, reject) => {
        imageElement.onload = resolve;
        imageElement.onerror = reject;
      });
    }

    const crop = avatarEditorRef.current!.getCroppingRect();
    const imageBlob = await getCroppedImg(imageElement, crop, width, state.mimeType);

    (async () => {
      try {
        const formData = new FormData();
        formData.append('file', imageBlob);
        const res = await Api.uploadImage(formData);

        const newUrl = (await res.json()).url;
        props.getImageUrl(newUrl);

        state.avatar = newUrl;

        await sleep(100);

        state.avatarDialogOpen = false;
        state.showMenu = false;
        props.close && props.close(true);
        state.showImageLib = false;
      } catch (err) {
        console.log(err);
      }
      state.avatarLoading = false;
    })();
  };

  React.useEffect(() => {
    if (!state.avatar && props.imageUrl) {
      state.avatarTemp = props.imageUrl;
      state.avatar = props.imageUrl;
    }
  }, [props.imageUrl, state.avatar, state.avatarTemp]);

  React.useEffect(() => {
    if (!state.avatarDialogOpen) {
      state.scale = 1;
      state.externalImageUrl = '';
      state.mimeType = '';
      state.avatarTemp = '';
    }
  }, [state, state.avatarDialogOpen]);

  const Content = () => (
    <div>
      <div>
        <div className="mt-2 text-center text-18 py-4 font-bold">移动或缩放图片</div>
      </div>
      <div className="px-10">
        <div className="md:mx-5">
          <div
            className="relative mx-auto"
            style={{
              width: width * editorPlaceholderScale,
              height: (width * editorPlaceholderScale) / ratio,
            }}
          >
            <div
              className="top-0 canvas-container absolute"
              style={{
                transform: `translateX(-50%) scale(${editorPlaceholderScale})`,
                left: '50%',
              }}
            >
              <AvatarEditor
                ref={avatarEditorRef}
                width={width}
                height={width / ratio}
                border={0}
                scale={state.scale}
                image={state.externalImageUrl || state.avatarTemp}
              />
            </div>
          </div>

          <div className="slider-box flex items-center py-1 mt-1 text-xl text-gray-500">
            <ZoomOut className="mx-2" />
            <AvatarScaleSlider
              className="mx-2"
              step={0.001}
              min={1}
              max={2}
              onChange={(_e, v) => {
                state.scale = v as number;
              }}
            />
            <ZoomIn className="mx-2" />
          </div>
          <div className="m-3 flex pb-4 justify-center w-full md:w-auto">
            <Button
              outline
              color="gray"
              onClick={() => (state.avatarDialogOpen = false)}
              className="mr-5"
            >
              返回
            </Button>
            <Button onClick={handleAvatarSubmit} isDoing={state.avatarLoading}>
              确定
            </Button>
          </div>
        </div>
        <style jsx>{`
          .canvas-container {
            transform-origin: top;
          }
        `}</style>
      </div>
    </div>
  );

  return (
    <div
      className={classNames(
        {
          'h-0 overflow-hidden': props.hidden,
        },
        'image-editor',
      )}
    >
      <div
        className={classNames(
          {
            'shift-hidden': props.hidden,
          },
          'avatar-edit-box mt-2',
        )}
        onClick={() => (state.showMenu = true)}
        style={{ width: width * placeholderScale, height: (width * placeholderScale) / ratio }}
      >
        {state.avatar && <img src={state.avatar} alt="avatar" />}
        {state.avatar && (
          <div className="edit-button text-12">
            <Edit className="edit-icon" />
            更换{props.name || '图片'}
          </div>
        )}
        {!state.avatar && (
          <div
            className="flex items-center justify-center text-3xl bg-gray-200 text-gray-500"
            style={{ width: width * placeholderScale, height: (width * placeholderScale) / ratio }}
          >
            <div className="flex flex-col items-center pt-3-px">
              <CameraAlt />
              <div className="text-12 mt-1">上传{props.name || '图片'}</div>
            </div>
          </div>
        )}
      </div>

      <div
        className={classNames({
          'shift-hidden': props.hidden,
        })}
      >
        <input
          ref={avatarInputRef}
          hidden
          onChange={handleAvatarInputChange}
          accept="image/*"
          type="file"
        />
      </div>

      <Menu
        open={state.showMenu}
        close={() => {
          state.showMenu = false;
          props.close && props.close();
        }}
        loading={state.isUploadingOriginImage}
        selectMenuItem={(action: string) => {
          if (action === 'upload') {
            avatarInputRef.current!.click();
          } else if (action === 'openImageLib') {
            state.showImageLib = true;
          }
        }}
      />

      <ImageLibModal
        open={state.showImageLib}
        close={() => (state.showImageLib = false)}
        selectImage={async (url: string) => {
          if (props.useOriginImage) {
            state.showImageLib = false;
            state.isUploadingOriginImage = true;
            const newUrl = await transferResourceToCDN(url);
            props.getImageUrl(newUrl);
            await sleep(200);
            props.close && props.close(true);
          } else {
            state.showImageLib = false;
            state.externalImageUrl = url;
            state.mimeType = MimeType.getByExt(url.split('.').pop() as string);
            state.avatarDialogOpen = true;
          }
        }}
      />

      {isMobile && (
        <DrawerModal
          onClose={() => {
            if (!state.avatarLoading) {
              state.avatarDialogOpen = false;
            }
          }}
          open={state.avatarDialogOpen}
        >
          <div className="setting-avatar-crop-dialog">{Content()}</div>
        </DrawerModal>
      )}

      {isPc && (
        <Dialog
          maxWidth={false}
          className="setting-avatar-crop-dialog"
          onClose={() => {
            if (!state.avatarLoading) {
              state.avatarDialogOpen = false;
            }
          }}
          open={state.avatarDialogOpen}
        >
          {Content()}
        </Dialog>
      )}
    </div>
  );
});

export const AvatarScaleSlider = withStyles({
  root: {
    color: '#69b0bd',
    height: 6,
  },
  thumb: {
    height: 20,
    width: 20,
    backgroundColor: '#fff',
    border: '2px solid currentColor',
    marginTop: -7,
    marginLeft: -10,
    '&:focus,&:hover,&$active': {
      boxShadow: 'inherit',
    },
  },
  track: {
    height: 6,
    borderRadius: 4,
  },
  rail: {
    height: 6,
    borderRadius: 4,
  },
})(Slider);

export const getCroppedImg = (
  image: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number },
  width: number,
  mimeType: string,
) => {
  const canvas = document.createElement('canvas');
  const state = {
    sx: image.naturalWidth * crop.x,
    sy: image.naturalHeight * crop.y,
    sWidth: image.naturalWidth * crop.width,
    sHeight: image.naturalHeight * crop.height,
    dx: 0,
    dy: 0,
    dWidth: image.naturalWidth * crop.width,
    dHeight: image.naturalHeight * crop.height,
  };

  if (state.sWidth > width || state.sHeight > width) {
    const ratio = state.sWidth > state.sHeight ? width / state.sWidth : width / state.sHeight;

    state.dWidth *= ratio;
    state.dHeight *= ratio;
  }

  canvas.width = state.dWidth;
  canvas.height = state.dHeight;
  const ctx = canvas.getContext('2d');

  ctx!.drawImage(
    image,
    state.sx,
    state.sy,
    state.sWidth,
    state.sHeight,
    state.dx,
    state.dy,
    state.dWidth,
    state.dHeight,
  );

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob as Blob);
      },
      mimeType || 'image/png',
      1,
    );
  });
};
