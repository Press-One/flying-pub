import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import css from 'styled-jsx/css';
import { Dialog } from '@material-ui/core';
import {
  Settings as SettingsIcon,
  LockOutlined,
  Link,
  AccountCircleOutlined,
  InfoOutlined,
} from '@material-ui/icons';
import { useStore } from 'store';

import { ProfileChange } from './ProfileChange';
import { AccountBind } from './AccountBind';
import { PhoneChangePassword } from './PhoneChangePassword';
import { Preference } from './Preference';
import DrawerModal from 'components/DrawerModal';
import { isMobile } from 'utils';

const style = css`
  .settings-modal {
    width: 700px;
    height: 550px;
  }
`;

export default observer(() => {
  const { userStore, settingsStore, modalStore } = useStore();

  const supportPhoneBinding = !!settingsStore.settings['auth.providers']?.includes('phone');
  const phoneBinded = userStore.profiles.some((v) => v.provider === 'phone');

  const tab = modalStore.settings.tab;

  const renderTabContent = () => (
    <>
      {tab === 'profile' && (
        <TabContent>
          <div className="font-bold flex items-center text-18 justify-center md:justify-start">
            <span className="text-2xl mr-2 items-center hidden md:flex">
              <InfoOutlined />
            </span>
            修改资料
          </div>
          <div className="mt-4">
            <ProfileChange />
          </div>
        </TabContent>
      )}

      {tab === 'preference' && (
        <TabContent>
          <div className="font-bold flex items-center text-18 justify-center md:justify-start">
            <span className="text-2xl mr-2 items-center hidden md:flex">
              <AccountCircleOutlined />
            </span>
            偏好设置
          </div>
          <div className="mt-4">
            <Preference />
          </div>
        </TabContent>
      )}

      {tab === 'password' && (
        <TabContent>
          <div className="font-bold flex items-center text-18 justify-center md:justify-start">
            <span className="text-2xl mr-2 items-center hidden md:flex">
              <LockOutlined />
            </span>
            修改密码
          </div>
          <div className="mt-4">
            <PhoneChangePassword />
          </div>
        </TabContent>
      )}

      {tab === 'bind' && (
        <TabContent>
          <div className="font-bold flex items-center text-18 justify-center md:justify-start">
            <span className="text-2xl mr-2 items-center hidden md:flex">
              <Link />
            </span>
            账号绑定
          </div>
          <div className="mt-4">
            <AccountBind />
          </div>
        </TabContent>
      )}
    </>
  );

  if (isMobile) {
    return (
      <DrawerModal open={modalStore.settings.open} onClose={() => modalStore.closeSettings()}>
        <div className="text-gray-700">{renderTabContent()}</div>
      </DrawerModal>
    );
  }

  return (
    <Dialog
      className="flex justify-center items-center"
      classes={{ paper: 'settings-modal-paper' }}
      maxWidth={false}
      open={modalStore.settings.open}
      onClose={() => modalStore.closeSettings()}
    >
      <div className="settings-modal flex max-h-screen text-gray-700">
        <div className="flex-none">
          <div className="py-8 px-6">
            <div className="font-bold flex items-center text-xl">
              <span className="text-2xl mr-2 flex items-center">
                <SettingsIcon />
              </span>
              账号设置
            </div>
            <div className="ml-2 mt-3">
              <TabButton
                className="pr-10"
                isActive={tab === 'profile'}
                onClick={() => modalStore.openSettings('profile')}
              >
                <span className="text-lg mr-2 flex items-center">
                  <InfoOutlined />
                </span>
                修改资料
              </TabButton>

              <TabButton
                className="pr-10"
                isActive={tab === 'preference'}
                onClick={() => modalStore.openSettings('preference')}
              >
                <span className="text-lg mr-2 flex items-center">
                  <AccountCircleOutlined />
                </span>
                偏好设置
              </TabButton>

              {supportPhoneBinding && phoneBinded && (
                <TabButton
                  className="pr-10"
                  isActive={tab === 'password'}
                  onClick={() => modalStore.openSettings('password')}
                >
                  <span className="text-lg mr-2 flex items-center">
                    <LockOutlined />
                  </span>
                  修改密码
                </TabButton>
              )}

              <TabButton
                className="pr-10"
                isActive={tab === 'bind'}
                onClick={() => modalStore.openSettings('bind')}
              >
                <span className="text-lg mr-2 flex items-center">
                  <Link />
                </span>
                账号绑定
              </TabButton>
            </div>
          </div>
        </div>

        <div className="flex-1 border-l border-gray-400 wallet-content">{renderTabContent()}</div>
      </div>
      <style jsx>{style}</style>
    </Dialog>
  );
});

interface TabButtonProps {
  className?: string;
  isActive: boolean;
  onClick?: () => unknown;
  children: React.ReactNode;
  disabled?: boolean;
}
const TabButton = (props: TabButtonProps) => {
  return (
    <div
      className={classNames(
        'font-bold flex items-center px-2 py-2 mt-2 rounded text-base',
        'select-none cursor-pointer',
        props.isActive && 'bg-blue-400 text-white',
        !props.disabled && !props.isActive && 'text-gray-700',
        !!props.disabled && 'text-gray-500 cursor-not-allowed',
        props.className,
      )}
      onClick={props.disabled ? undefined : props.onClick}
    >
      {props.children}
    </div>
  );
};

const TabContent = (props: { children: React.ReactNode }) => (
  <div className="p-8">{props.children}</div>
);
