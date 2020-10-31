import React from 'react';
import classNames from 'classnames';
import { observer, useLocalStore } from 'mobx-react-lite';
import { useStore } from 'store';
import {
  CircularProgress,
  Input,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Button as MuiButton,
  Tooltip,
} from '@material-ui/core';
import Info from '@material-ui/icons/Info';
import Button from 'components/Button';
import DrawerModal from 'components/DrawerModal';
import Modal from 'components/Modal';
import { isMobile, getLoginUrl, sleep, isWeChat } from 'utils';
import Api from 'api';
import ArrowDropUp from '@material-ui/icons/ArrowDropUp';
import ArrowDropDown from '@material-ui/icons/ArrowDropDown';

import './index.sass';

export default observer(() => {
  const state = useLocalStore(() => ({
    tab: 0,
    loadingProvider: '',

    phone: '',
    code: '',
    password: '',

    countdown: 0,
    sendCodeLoading: false,
    logining: false,
    loginDone: false,

    showPhoneLogin: true,
    loginExpand: false,

    showAppIconActionTooltip: false,

    get phoneValid() {
      return /^1\d{10}$/.test(this.phone);
    },
    get codeValid() {
      return !!this.code.trim();
    },
    get passwordValid() {
      return !!this.password;
    },
    get formValid() {
      return state.tab === 0 ? this.phoneValid && !!this.code : this.phoneValid && !!this.password;
    },
  }));
  const { snackbarStore, modalStore, settingsStore } = useStore();
  const { settings } = settingsStore;

  const codeInputRef = React.useRef<HTMLInputElement>();
  const passwordInputRef = React.useRef<HTMLInputElement>();

  const handleEnter = (e: React.KeyboardEvent, type: 'phone' | 'code' | 'password') => {
    if (e.key !== 'Enter') {
      return;
    }
    if (type === 'phone') {
      if (state.tab === 0) {
        codeInputRef.current?.focus();
      } else {
        passwordInputRef.current?.focus();
      }
    }
    if (type === 'code' || type === 'password') {
      handlePhoneLogin();
    }
  };

  const handleSendCode = async () => {
    if (!state.phoneValid) {
      return;
    }

    state.sendCodeLoading = true;
    try {
      await Api.getPhoneCode(state.phone);
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

  const handlePhoneLogin = async () => {
    if (!state.formValid) {
      return;
    }

    if (state.logining) {
      return;
    }

    const login = async () => {
      if (state.tab === 0) {
        try {
          await Api.verifyPhoneCode(state.phone, state.code.trim());
          await sleep(800);
        } catch (e) {
          state.logining = false;
          snackbarStore.show({
            message: '登录失败',
            type: 'error',
            duration: 2000,
          });
          return;
        }
      } else {
        try {
          await Api.phonePasswordLogin(state.phone, state.password);
          await sleep(800);
        } catch (e) {
          await sleep(500);
          state.logining = false;
          if (e.message === 'phone or password is invalid' || e.message === 'profile not found') {
            snackbarStore.show({
              message: '手机或密码错误',
              type: 'error',
              duration: 2000,
            });
          } else if (e.message === 'hashPassword is required') {
            snackbarStore.show({
              message: '这个手机号未设置密码，请使用验证码登录',
              type: 'error',
              duration: 2000,
            });
          } else {
            snackbarStore.show({
              message: '登录失败',
              type: 'error',
              duration: 2000,
            });
          }
          return;
        }
      }

      try {
        state.loginDone = true;
        window.location.reload();
      } catch (e) {
        state.logining = false;
        snackbarStore.show({
          message: '登录失败',
          type: 'error',
          duration: 2000,
        });
        return;
      }
    };

    state.logining = true;
    state.loginDone = false;
    await login();
  };

  const toggleLoginExpand = async () => {
    state.loginExpand = !state.loginExpand;
    if (state.loginExpand) {
      await sleep(400);
      state.showAppIconActionTooltip = true;
    } else {
      state.showAppIconActionTooltip = false;
    }
  };

  const ModalComponent = isMobile ? DrawerModal : Modal;

  return (
    <ModalComponent open={modalStore.phoneLogin} onClose={modalStore.closePhoneLogin}>
      <div
        className={classNames(
          'phone-login-modal flex flex-col items-start bg-white md:rounded',
          !isMobile && 'py-8 px-12',
          isMobile && 'is-mobile p-6',
        )}
      >
        <div className="self-stretch relative">
          <div className="absolute py-px bottom-0 bg-gray-200 w-full" />
          <Tabs
            className="text-lg"
            indicatorColor="primary"
            value={state.tab}
            onChange={(_e, tab) => {
              state.tab = tab;
            }}
          >
            <Tab className="form-tab" classes={{ wrapper: 'text-base' }} label="验证码登录" />
            <Tab className="form-tab" classes={{ wrapper: 'text-base' }} label="密码登录" />
          </Tabs>
        </div>

        <div className="input-row mt-8 flex items-center self-stretch border-gray-200 border-2 rounded-md">
          <Select
            className="region-select flex-none mx-3"
            value="86"
            renderValue={(v) => `+ ${v as string}`}
          >
            <MenuItem value="86">+ 86</MenuItem>
          </Select>
          <div className="self-stretch pl-px border-l-2 border-gray-200" />
          <Input
            className="flex-1 form-input mx-3"
            placeholder="请输入手机号码"
            value={state.phone}
            onChange={(e) => {
              state.phone = e.target.value;
            }}
            onKeyPress={(e) => handleEnter(e, 'phone')}
            inputProps={{
              maxLength: 11,
            }}
          />
        </div>

        {state.tab === 0 && (
          <div className="input-row mt-4 flex items-center self-stretch border-gray-200 border-2 rounded-md">
            <Input
              className="flex-1 form-input mx-3"
              placeholder="请输入验证码"
              value={state.code}
              onChange={(e) => {
                state.code = e.target.value;
              }}
              inputRef={codeInputRef}
              onKeyPress={(e) => handleEnter(e, 'code')}
              inputProps={{
                maxLength: 6,
              }}
            />

            <MuiButton
              color="primary"
              disableRipple
              disabled={!state.phoneValid || !!state.countdown || state.sendCodeLoading}
              onClick={handleSendCode}
            >
              <span className="px-1 flex items-center">
                {state.sendCodeLoading && (
                  <CircularProgress
                    className="mr-2 text-blue-400"
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
              </span>
            </MuiButton>
            <div className="pl-1 pr-px" />
          </div>
        )}

        {state.tab === 1 && (
          <div className="input-row mt-4 flex items-center self-stretch border-gray-200 border-2 rounded-md">
            <Input
              className="flex-1 form-input mx-3"
              placeholder="请输入密码"
              type="password"
              value={state.password}
              onKeyPress={(e) => handleEnter(e, 'password')}
              onChange={(e) => {
                state.password = e.target.value;
              }}
              inputRef={passwordInputRef}
            />
          </div>
        )}

        <div className="mt-6 w-full">
          <Button
            className="w-full"
            disabled={!state.formValid}
            onClick={handlePhoneLogin}
            isDoing={state.logining}
          >
            登录
          </Button>
        </div>

        {!isWeChat && (
          <div className="w-full mt-6">
            <span className="cursor-pointer text-blue-400" onClick={toggleLoginExpand}>
              {state.loginExpand ? (
                <div className="flex items-center">
                  使用手机登录
                  <span className="flex items-center ml-1 text-2xl">
                    <ArrowDropUp />
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  使用 {settings['mixinApp.name']} 登录
                  <span className="flex items-center ml-1 text-2xl">
                    <ArrowDropDown />
                  </span>
                </div>
              )}
            </span>
            {state.loginExpand && (
              <div>
                <div className="pt-16 md:pt-10 flex justify-center">
                  <Tooltip
                    open={state.showAppIconActionTooltip}
                    arrow
                    placement="top"
                    title={
                      isMobile
                        ? `点击图标，使用 ${settings['mixinApp.name']} 登录`
                        : `点击图标，使用 ${settings['mixinApp.name']} 扫码登录`
                    }
                  >
                    <div className="-mt-3 md:mt-0 flex justify-center">
                      <a
                        href={getLoginUrl()}
                        className="block"
                        style={{
                          width: '60px',
                          height: '60px',
                        }}
                      >
                        <img
                          className="rounded-md cursor-pointer border border-gray-300"
                          src={settings['mixinApp.logo']}
                          width="60"
                          height="60"
                          alt="XueXi"
                        />
                      </a>
                    </div>
                  </Tooltip>
                </div>
                <div className="flex justify-center items-center text-gray-500 text-xs mt-6">
                  <span className="flex items-center text-lg mr-1">
                    <Info />
                  </span>
                  手机还没有安装 {settings['mixinApp.name']} ？
                  <a
                    className="text-blue-400"
                    href={settings['mixinApp.downloadUrl']}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    前往下载
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalComponent>
  );
});
