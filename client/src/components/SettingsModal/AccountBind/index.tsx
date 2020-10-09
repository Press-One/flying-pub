import React from 'react';
import classNames from 'classnames';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Button as MuiButton, CircularProgress, TextField } from '@material-ui/core';
import CheckCircle from '@material-ui/icons/CheckCircle';
import { getProtectedPhone, isMobile, getApiEndpoint } from 'utils';

import Button from 'components/Button';
import ButtonProgress from 'components/ButtonProgress';
import { useStore } from 'store';
import Api from 'api';

import './index.sass';

export const AccountBind = observer(() => {
  const state = useLocalStore(() => ({
    phone: '',
    code: '',

    countdown: 0,
    sendCodeLoading: false,
    phoneBinding: false,
    phoneBindingDone: false,

    get phoneValid() {
      return /^1\d{10}$/.test(this.phone);
    },
    get codeValid() {
      return !!this.code.trim();
    },
    get formValid() {
      return this.phoneValid && !!this.code;
    },
  }));

  const { userStore, settingsStore, snackbarStore } = useStore();
  const codeInputRef = React.useRef<HTMLInputElement>(null);

  const handleSendCode = async () => {
    if (!state.phoneValid) {
      return;
    }

    state.sendCodeLoading = true;
    try {
      await Api.getPhoneCode(state.phone);
      snackbarStore.show({
        message: '验证码已发送',
      });
      if (codeInputRef.current) {
        codeInputRef.current.focus()
      }
      state.countdown = 60;
      const id = window.setInterval(() => {
        state.countdown -= 1;
        if (state.countdown === 0) {
          window.clearInterval(id);
        }
      }, 1000);
    } catch (e) {
      snackbarStore.show({
        message: '验证码发送失败',
        type: 'error',
      });
    } finally {
      state.sendCodeLoading = false;
    }
  };

  const handleBindPhone = async () => {
    if (!state.formValid) {
      return;
    }
    state.phoneBindingDone = false;
    state.phoneBinding = true;
    try {
      const profile = await Api.phoneBind(state.phone, state.code.trim());
      userStore.addProfile(profile);
      snackbarStore.show({
        message: '绑定手机成功',
        duration: 2000,
      });
      state.phoneBindingDone = true;
    } catch (e) {
      let errorMesasge = '绑定失败';
      if (e.message === 'alread bind phone') {
        errorMesasge = '当前账号已绑定手机';
      }
      if (e.message === 'code is invalid') {
        errorMesasge = '验证码错误';
      }
      snackbarStore.show({
        message: errorMesasge,
        type: 'error',
        duration: 2000,
      });
    } finally {
      state.phoneBinding = false;
    }
  };

  const mixinProfile = userStore.profiles.find((v) => v.provider === 'mixin');
  const phoneProfile = userStore.profiles.find((v) => v.provider === 'phone');

  const providers = settingsStore.settings['auth.providers'] ?? [];
  const supportPhoneBinding = providers.includes('phone');
  const supportMixinBinding = providers.includes('mixin');

  return (
    <div className="account-bind flex flex-col items-start -mt-4">
      {supportPhoneBinding && (
        <div className="flex pt-4 pb-4 justift-between items-center self-stretch border-b border-gray-400">
          <div className="flex-1">
            <div className="text-lg mt-4">手机</div>
            <div className="mt-2">{!!phoneProfile && getProtectedPhone(phoneProfile.name)}</div>

            {!phoneProfile && (
              <div className={classNames('phone-bind-form mt-4', isMobile && 'is-mobile')}>
                <TextField
                  className="mt-4 w-full"
                  label="手机号 +86"
                  value={state.phone}
                  onChange={(e) => {
                    state.phone = e.target.value;
                  }}
                  inputProps={{
                    maxLength: 11,
                  }}
                />

                <div className="relative flex mt-3 w-full">
                  <TextField
                    className="flex-grow"
                    label="验证码"
                    inputProps={{ maxLength: 6 }}
                    inputRef={codeInputRef}
                    value={state.code}
                    onChange={(e) => {
                      state.code = e.target.value;
                    }}
                  />
                  <div className="absolute send-code right-0 bottom-0 mb-px">
                    <MuiButton
                      size="small"
                      color="primary"
                      disabled={!state.phoneValid || !!state.countdown || state.sendCodeLoading}
                      onClick={handleSendCode}
                    >
                      {state.sendCodeLoading && (
                        <CircularProgress
                          className="mr-1 text-blue-400"
                          color="inherit"
                          size={16}
                          thickness={5}
                        />
                      )}

                      <span
                        className={classNames({
                          'text-blue-400': !state.countdown,
                        })}
                      >
                        {state.countdown ? `${state.countdown} 秒后重新发送` : '发送验证码'}
                      </span>
                    </MuiButton>
                  </div>
                </div>

                <div className="mt-6 mb-4">
                  <Button disabled={!state.formValid} onClick={handleBindPhone}>
                    <span>绑定</span>
                    <ButtonProgress isDoing={state.phoneBinding} isDone={state.phoneBindingDone} />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {phoneProfile && (
            <span className="text-xl text-green-400">
              <CheckCircle />
            </span>
          )}
        </div>
      )}

      {supportMixinBinding && (
        <div className="flex pt-8 pb-4 justift-between items-center self-stretch border-b border-gray-400">
          <div className="flex-1">
            <div className="text-lg">{settingsStore.settings['mixinApp.name']} 账号</div>
            {mixinProfile && (
              <div className="flex mt-3">
                <img
                  className="w-10 h-10 rounded-full"
                  src={mixinProfile.avatar}
                  alt="mixin avatar"
                />
                <div className="ml-3">
                  <div className="font-bold">{mixinProfile.name}</div>
                  <div className="text-gray-500 text-xs">{mixinProfile.providerId}</div>
                </div>
              </div>
            )}
          </div>

          {!mixinProfile && (
            <a
              href={`${getApiEndpoint()}/api/auth/mixin/bind?redirect=${encodeURIComponent(
                window.location.href,
              )}`}
            >
              <Button>
                <span className="normal-case">绑定</span>
              </Button>
            </a>
          )}

          {mixinProfile && (
            <span className="text-xl text-green-400">
              <CheckCircle />
            </span>
          )}
        </div>
      )}
    </div>
  );
});
