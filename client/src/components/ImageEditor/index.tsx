import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import AvatarEditor from 'react-avatar-editor';
import Button from 'components/Button';
import { Edit, ZoomIn, ZoomOut, CameraAlt } from '@material-ui/icons';
import { Dialog, Slider, withStyles } from '@material-ui/core';
import DrawerModal from 'components/DrawerModal';
import { isMobile, isPc } from 'utils';
import Api from 'api';

import './index.sass';

export default observer((props: any) => {
  const state = useLocalStore(() => ({
    avatar: '',
    nickname: '',
    bio: '',
    submitting: false,
    submitDone: false,

    avatarTemp: '',
    avatarDialogOpen: false,
    avatarLoading: false,
    avatarDone: false,
    scale: 1,
  }));

  const width: any = React.useMemo(() => props.width || 120, [props.width]);
  const ratio: any = React.useMemo(() => props.ratio || 1, [props.ratio]);

  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const avatarEditorRef = React.useRef<AvatarEditor>(null);

  const handleEditAvatar = () => {
    avatarInputRef.current!.click();
  };

  const handleAvatarInputChange = () => {
    const file = avatarInputRef.current!.files![0];
    avatarInputRef.current!.value = '';
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.addEventListener('load', () => {
        state.avatarTemp = reader.result as string;
        state.avatarDialogOpen = true;
      });
    }
  };

  const handleAvatarSubmit = async () => {
    if (state.avatarLoading) {
      return;
    }

    state.avatarLoading = true;

    const imageElement = new Image();
    imageElement.src = state.avatarTemp;
    const crop = avatarEditorRef.current!.getCroppingRect();
    const imageBlob = await getCroppedImg(imageElement, crop);

    const run = async () => {
      const formData = new FormData();
      formData.append('file', imageBlob);
      const res = await Api.uploadImage(formData);

      const newUrl = (await res.json()).url;
      props.getImageUrl(newUrl);

      setTimeout(() => {
        state.avatarDialogOpen = false;
      });
      state.avatar = state.avatarTemp;
    };

    run().finally(() => {
      state.avatarLoading = false;
    });
  };

  React.useEffect(() => {
    if (!state.avatar && props.imageUrl) {
      state.avatarTemp = props.imageUrl;
      state.avatar = props.imageUrl;
    }
  }, [props.imageUrl, state.avatar, state.avatarTemp]);

  const Content = () => (
    <div>
      <div>
        <div className="mt-2 text-center text-18 py-4 font-bold">移动或缩放图片</div>
      </div>
      <div className="px-10">
        <AvatarEditor
          ref={avatarEditorRef}
          width={300}
          height={300 / ratio}
          border={0}
          scale={1.1 ** state.scale}
          image={state.avatarTemp}
        />

        <div className="slider-box flex items-center py-1 mt-1 text-xl text-gray-500">
          <ZoomOut className="mx-2" />
          <AvatarScaleSlider
            className="mx-2"
            step={0.001}
            min={0}
            onChange={(_e, v) => {
              state.scale = v as number;
            }}
            max={20}
          />
          <ZoomIn className="mx-2" />
        </div>
        <div className="m-3 flex pb-4 justify-center w-full md:w-auto">
          <Button onClick={handleAvatarSubmit} isDoing={state.avatarLoading}>
            确定
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="image-editor">
      <div
        className="avatar-edit-box mt-2"
        onClick={handleEditAvatar}
        style={{ width: width, height: width / ratio }}
      >
        {state.avatar && <img src={state.avatar} alt="avatar" />}
        {state.avatar && (
          <div className="edit-button text-13">
            <Edit className="edit-icon" />
            更换{props.name || '图片'}
          </div>
        )}
        {!state.avatar && (
          <div
            className="flex items-center justify-center text-3xl bg-gray-200 text-gray-500"
            style={{ width: width, height: width / ratio }}
          >
            <div className="flex flex-col items-center">
              <CameraAlt />
              <div className="text-12 mt-1">上传{props.name || '图片'}</div>
            </div>
          </div>
        )}
      </div>

      <input
        ref={avatarInputRef}
        hidden
        onChange={handleAvatarInputChange}
        accept="image/*"
        type="file"
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

  if (state.sWidth > 512 || state.sHeight > 512) {
    const ratio = state.sWidth > state.sHeight ? 512 / state.sWidth : 512 / state.sHeight;

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
      'image/png',
      1,
    );
  });
};
