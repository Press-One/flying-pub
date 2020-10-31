import React from 'react';
import classNames from 'classnames';
import { when } from 'mobx';
import { observer, useLocalStore } from 'mobx-react-lite';
import {
  Button as MuiButton,
  CircularProgress,
  FormControl,
  FormHelperText,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  Tab,
  Tabs,
  TextField,
} from '@material-ui/core';
import { Visibility, VisibilityOff } from '@material-ui/icons';
import { getProtectedPhone, isMobile } from 'utils';

import Button from 'components/Button';
import { useStore } from 'store';
import Api from 'api';

import './index.sass';

export const PhoneChangePassword = observer(() => {
  const state = useLocalStore(() => ({
    tab: 'reset',
    phone: '',
    code: '',
    oldPassword: '',
    newPassword: '',

    countdown: 0,
    sendCodeLoading: false,
    phoneBinding: false,
    phoneBindingDone: false,

    peakPassword: false,
    peakNewPassword: false,

    get phoneValid() {
      return /^1\d{10}$/.test(this.phone);
    },
    get codeValid() {
      return !!this.code.trim();
    },
    get oldPasswordValid() {
      return this.oldPassword.length > 0;
    },
    get newPasswordValid() {
      return this.newPassword.length >= 8;
    },
    get formValid() {
      return (
        this.phoneValid &&
        this.newPasswordValid &&
        (state.tab === 'reset' ? this.codeValid : this.oldPasswordValid)
      );
    },
  }));

  const { userStore, snackbarStore } = useStore();

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

  const handleSubmit = async () => {
    if (!state.formValid) {
      return;
    }
    state.phoneBinding = true;
    state.phoneBindingDone = false;
    try {
      let message;
      let params;
      if (state.tab === 'reset') {
        params = {
          phone: state.phone,
          code: state.code.trim(),
          password: state.newPassword,
        };
        message = '重置密码成功';
        state.newPassword = '';
        state.code = '';
      } else {
        params = {
          phone: state.phone,
          oldPassword: state.oldPassword,
          password: state.newPassword,
        };
        state.newPassword = '';
        state.oldPassword = '';
        message = '修改密码成功';
      }
      await Api.setPassword(params);
      snackbarStore.show({
        message,
        duration: 2000,
      });
      state.phoneBindingDone = true;
    } catch (e) {
      let errorMesasge = '修改密码失败';
      if (e.message === 'oldPassword is invalid') {
        errorMesasge = '旧密码错误';
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

  const phoneProfile = userStore.profiles.find((v) => v.provider === 'phone');

  if (!phoneProfile) {
    return <div>需要绑定手机后才能修改密码</div>;
  }

  React.useEffect(() => {
    const cancel = when(
      () => userStore.profiles.find((v) => v.provider === 'phone'),
      () => {
        const phoneProfile = userStore.profiles.find((v) => v.provider === 'phone');
        state.phone = phoneProfile.name;
      },
    );

    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="phone-change-password flex flex-col items-center md:items-start -mt-4">
      <div className="relative mt-3 flex flex-col">
        <div className="absolute py-px bottom-0 bg-gray-200 w-full" />
        <Tabs
          value={state.tab}
          onChange={(_e, tab) => {
            state.tab = tab;
          }}
        >
          <Tab value="reset" className="form-tab" label="使用验证码" />
          <Tab value="set" className="form-tab" label="使用旧密码" />
        </Tabs>
      </div>

      <div className={classNames('password-change-form mt-4', isMobile && 'is-mobile')}>
        <TextField
          className="w-full"
          label="手机号 +86"
          value={getProtectedPhone(state.phone)}
          disabled
        />

        {state.tab === 'reset' && (
          <div className="relative flex mt-3 w-full">
            <TextField
              className="flex-grow"
              label="验证码"
              inputProps={{ maxLength: 6 }}
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
        )}

        {state.tab === 'set' && (
          <div className="mt-3 pt-px">
            <FormControl className="w-full" size="small">
              <InputLabel>
                <span className="text-sm">旧密码</span>
              </InputLabel>
              <Input
                type={state.peakPassword ? 'text' : 'password'}
                value={state.oldPassword}
                onChange={(e) => {
                  state.oldPassword = e.target.value;
                }}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="toggle password visibility"
                      onClick={() => {
                        state.peakPassword = !state.peakPassword;
                      }}
                      edge="end"
                    >
                      {state.peakPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
          </div>
        )}

        <div className="mt-3">
          <FormControl className="w-full" size="small">
            <InputLabel>
              <span className="text-sm">新密码</span>
            </InputLabel>
            <Input
              type={state.peakNewPassword ? 'text' : 'password'}
              value={state.newPassword}
              name="new-password"
              autoComplete="new-password"
              onChange={(e) => {
                state.newPassword = e.target.value;
              }}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label="toggle password visibility"
                    onClick={() => {
                      state.peakNewPassword = !state.peakNewPassword;
                    }}
                    edge="end"
                  >
                    {state.peakNewPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              }
            />
            <FormHelperText>不少于8个字符</FormHelperText>
          </FormControl>
        </div>

        <div
          className={classNames(
            {
              'w-full': isMobile,
            },
            'mt-8 mb-4',
          )}
        >
          <Button
            fullWidth={isMobile}
            disabled={!state.formValid}
            onClick={handleSubmit}
            isDoing={state.phoneBinding}
            isDone={state.phoneBindingDone}
          >
            <span>{state.tab === 'reset' ? '重置密码' : '修改密码'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
});
