import React from 'react';
import classNames from 'classnames';
import { when } from 'mobx';
import { observer, useLocalStore } from 'mobx-react-lite';
import AvatarEditor from 'react-avatar-editor';
import {
  Dialog,
  DialogTitle,
  FormControl,
  InputLabel,
  OutlinedInput,
  Slider,
  withStyles,
} from '@material-ui/core';
import { Edit, ZoomIn, ZoomOut } from '@material-ui/icons';

import Button from 'components/Button';
import ButtonProgress from 'components/ButtonProgress';
import { useStore } from 'store';
import { isMobile } from 'utils';
import Api from 'api';

import './index.sass';

export const ProfileChange = observer(() => {
  const state = useLocalStore(() => ({
    avatar: '',
    nickname: '',
    bio: '',
    submitting: false,
    submitDone: false,

    avatarDialogOpen: false,
    avatarLoading: false,
    avatarDone: false,
    scale: 1,
  }));

  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const avatarEditorRef = React.useRef<AvatarEditor>(null);
  const { userStore, snackbarStore } = useStore();

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
        state.avatar = reader.result as string;
        state.avatarDialogOpen = true;
      });
    }
  };

  const handleAvatarSubmit = async () => {
    const imageElement = new Image();
    imageElement.src = state.avatar;
    const crop = avatarEditorRef.current!.getCroppingRect();
    const imageBlob = await getCroppedImg(imageElement, crop);

    const run = async () => {
      state.avatarDone = false;
      state.avatarLoading = true;

      const formData = new FormData();
      formData.append('file', imageBlob);
      const res = await Api.uploadImage(formData);

      const newUrl = (await res.json()).url;

      await Api.updateUser({
        avatar: newUrl,
      });

      state.avatar = newUrl;
      userStore.user.avatar = newUrl;

      snackbarStore.show({
        message: '修改头像成功',
        duration: 2000,
      });
      setTimeout(() => {
        state.avatarDialogOpen = false;
      });
      state.avatarDone = true;
    };

    run().finally(() => {
      state.avatarLoading = false;
    });
  };

  const handleSubmit = async () => {
    state.submitDone = false;
    state.submitting = true;
    const nickname = state.nickname;
    const bio = state.bio;

    try {
      await Api.updateUser({
        nickname: state.nickname,
        bio: state.bio,
      });
      const user = userStore.user;
      user.nickname = nickname;
      user.bio = bio;
      snackbarStore.show({
        message: '修改个人资料成功',
        duration: 2000,
      });
      state.submitDone = true;
    } finally {
      state.submitting = false;
    }
  };

  React.useEffect(() => {
    const cancel = when(
      () => userStore.user.id,
      () => {
        state.avatar = userStore.user.avatar;
        state.nickname = userStore.user.nickname;
        state.bio = userStore.user.bio;
      },
    );

    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="profile-edit flex flex-col items-center md:items-start -mt-2">
      <div className="py-2 mt-2">
        <div className="font-bold">修改头像</div>
        <div className="avatar-edit-box mt-2" onClick={handleEditAvatar}>
          <img className="bg-gray-200" src={state.avatar} alt="avatar" />

          <div className="edit-button">
            <Edit className="edit-icon" />
            编辑
          </div>
        </div>

        <input
          ref={avatarInputRef}
          hidden
          onChange={handleAvatarInputChange}
          accept="image/*"
          type="file"
        />

        <Dialog
          className="setting-avatar-crop-dialog"
          onClose={() => {
            if (!state.avatarLoading) {
              state.avatarDialogOpen = false;
            }
          }}
          open={state.avatarDialogOpen}
        >
          <DialogTitle>修改头像</DialogTitle>
          <AvatarEditor
            ref={avatarEditorRef}
            width={300}
            height={300}
            border={0}
            scale={1.1 ** state.scale}
            image={state.avatar}
          />

          <div className="slider-box flex items-center py-1 text-xl text-gray-500">
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
          <div className="m-3 flex">
            <Button className="flex-1" onClick={handleAvatarSubmit} disabled={state.avatarLoading}>
              保存
              <ButtonProgress isDoing={state.avatarLoading} isDone={state.avatarDone} />
            </Button>
          </div>
        </Dialog>
      </div>

      <div className="form-item mt-6 w-full">
        <FormControl className="w-full" variant="outlined" size="small">
          <InputLabel>昵称</InputLabel>
          <OutlinedInput
            value={state.nickname}
            onChange={(e) => {
              state.nickname = e.target.value;
            }}
            labelWidth={60}
          />
        </FormControl>
      </div>

      <div className="form-item mt-6 w-full">
        <FormControl className="w-full" variant="outlined" size="small">
          <InputLabel>简介</InputLabel>
          <OutlinedInput
            value={state.bio}
            onChange={(e) => {
              state.bio = e.target.value;
            }}
            rowsMin={3}
            rowsMax={6}
            rows={3}
            multiline
            labelWidth={60}
            inputProps={{
              maxLength: 200,
            }}
          />
        </FormControl>
      </div>

      <div
        className={classNames(
          {
            'w-full': isMobile,
          },
          'mt-10',
        )}
      >
        <Button fullWidth={isMobile} onClick={handleSubmit} disabled={state.submitting}>
          提交修改
          <ButtonProgress isDoing={state.submitting} isDone={state.submitDone} />
        </Button>
      </div>
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
