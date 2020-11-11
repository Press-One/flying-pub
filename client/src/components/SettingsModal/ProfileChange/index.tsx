import React from 'react';
import classNames from 'classnames';
import { when } from 'mobx';
import { observer, useLocalStore } from 'mobx-react-lite';
import ImageEditor from 'components/ImageEditor';
import { TextField, Switch } from '@material-ui/core';
import Button from 'components/Button';
import { useStore } from 'store';
import { isMobile, sleep } from 'utils';
import Api from 'api';

import './index.sass';

export const ProfileChange = observer(() => {
  const state = useLocalStore(() => ({
    avatar: '',
    cover: '',
    nickname: '',
    bio: '',
    privateSubscriptionEnabled: false,
    submitting: false,
    submitDone: false,
  }));

  const { userStore, modalStore } = useStore();

  const handleSubmit = async () => {
    state.submitDone = false;
    state.submitting = true;
    const nickname = state.nickname;
    const bio = state.bio;
    const avatar = state.avatar;
    const cover = state.cover;
    const privateSubscriptionEnabled = state.privateSubscriptionEnabled;

    try {
      await Api.updateUser({
        avatar: state.avatar,
        cover: state.cover,
        nickname: state.nickname,
        bio: state.bio,
        privateSubscriptionEnabled: state.privateSubscriptionEnabled,
      });
      const user = userStore.user;
      user.avatar = avatar;
      user.cover = cover;
      user.nickname = nickname;
      user.bio = bio;
      user.privateSubscriptionEnabled = privateSubscriptionEnabled;
      state.submitDone = true;
      if (isMobile) {
        (async () => {
          await sleep(500);
          modalStore.closeSettings();
        })();
      }
    } finally {
      state.submitting = false;
    }
  };

  React.useEffect(() => {
    const cancel = when(
      () => userStore.user.id,
      () => {
        state.avatar = userStore.user.avatar;
        state.cover = userStore.user.cover;
        state.nickname = userStore.user.nickname;
        state.bio = userStore.user.bio;
        state.privateSubscriptionEnabled = userStore.user.privateSubscriptionEnabled;
      },
    );

    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="profile-edit flex flex-col items-center md:items-start -mt-2">
      <div className="py-2 mt-2 flex items-end justify-center">
        <ImageEditor
          width={200}
          placeholderWidth={120}
          editorPlaceholderWidth={200}
          name="头像"
          imageUrl={state.avatar}
          getImageUrl={(url: string) => {
            state.avatar = url;
            handleSubmit();
          }}
        />
        <div className="px-4" />
        <ImageEditor
          width={700}
          placeholderWidth={150}
          editorPlaceholderWidth={300}
          ratio={3 / 2}
          name="封面"
          imageUrl={state.cover}
          getImageUrl={(url: string) => {
            state.cover = url;
            handleSubmit();
          }}
        />
      </div>

      <div className="form-item mt-6 w-full">
        <TextField
          className="w-full"
          value={state.nickname}
          onChange={(e) => {
            state.nickname = e.target.value;
          }}
          label="昵称"
          margin="dense"
          variant="outlined"
        />
      </div>

      <div className="form-item pt-2 w-full">
        <TextField
          className="w-full"
          value={state.bio}
          onChange={(e) => {
            state.bio = e.target.value;
          }}
          label="简介"
          margin="dense"
          rowsMax={6}
          rows={3}
          multiline
          inputProps={{
            maxLength: 200,
          }}
          variant="outlined"
        />
      </div>

      <div className="flex items-center mt-3 w-full">
        <div className="font-bold text-14 text-gray-700">关注和被关注列表对他人不可见：</div>
        <Switch
          color="primary"
          checked={state.privateSubscriptionEnabled}
          onChange={(e) => {
            state.privateSubscriptionEnabled = e.target.checked;
          }}
        />
      </div>

      <div
        className={classNames(
          {
            'w-full': isMobile,
          },
          'mt-8 md:mt-10',
        )}
      >
        <Button
          fullWidth={isMobile}
          onClick={handleSubmit}
          isDoing={state.submitting}
          isDone={state.submitDone}
        >
          保存
        </Button>
      </div>
    </div>
  );
});
