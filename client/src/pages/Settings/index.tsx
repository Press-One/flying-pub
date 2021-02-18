import React from 'react';
import { observer } from 'mobx-react-lite';
import { RiSettings4Line } from 'react-icons/ri';
import { MdChevronRight } from 'react-icons/md';
import { BiEditAlt, BiLogOutCircle, BiKey } from 'react-icons/bi';
import { BsLink } from 'react-icons/bs';
import { useStore } from 'store';
import { getApiEndpoint } from 'utils';

export default observer(() => {
  const { modalStore, settingsStore, userStore } = useStore();
  const logoutUrl = `${getApiEndpoint()}/api/logout?from=${window.location.origin}`;
  const supportPhoneBinding = !!settingsStore.settings['auth.providers']?.includes('phone');
  const hasPhoneBinding = userStore.profiles.some((v) => v.provider === 'phone');

  return (
    <div className="pt-2">
      <div
        className="border-b border-gray-f2"
        onClick={() => {
          modalStore.openSettings('profile');
        }}
      >
        <div className="flex items-center justify-between text-gray-6d py-3 px-4 text-15 bg-white">
          <div className="flex items-center">
            <BiEditAlt className="text-24 mr-2 pr-2-px text-blue-400" />
            编辑资料
          </div>
          <MdChevronRight className="text-22 text-gray-d8" />
        </div>
      </div>
      <div
        className="border-b border-gray-f2"
        onClick={() => {
          modalStore.openSettings('preference');
        }}
      >
        <div className="flex items-center justify-between text-gray-6d py-3 px-4 text-15 bg-white">
          <div className="flex items-center">
            <RiSettings4Line className="text-24 mr-2 pr-2-px text-blue-400" />
            偏好设置
          </div>
          <MdChevronRight className="text-22 text-gray-d8" />
        </div>
      </div>
      <div
        className="border-b border-gray-f2"
        onClick={() => {
          modalStore.openSettings('bind');
        }}
      >
        <div className="flex items-center justify-between text-gray-6d py-3 px-4 text-15 bg-white">
          <div className="flex items-center">
            <BsLink className="text-24 mr-2 pr-2-px text-blue-400" />
            账号绑定
          </div>
          <MdChevronRight className="text-22 text-gray-d8" />
        </div>
      </div>
      {supportPhoneBinding && hasPhoneBinding && (
        <div
          className="border-b"
          onClick={() => {
            modalStore.openSettings('password');
          }}
        >
          <div className="flex items-center justify-between text-gray-6d py-3 px-4 text-15 bg-white">
            <div className="flex items-center">
              <BiKey className="text-24 mr-2 pr-2-px text-blue-400" />
              修改密码
            </div>
            <MdChevronRight className="text-22 text-gray-d8" />
          </div>
        </div>
      )}
      <div
        className="pt-2"
        onClick={() => {
          modalStore.openPageLoading();
          window.location.href = logoutUrl;
        }}
      >
        <div className="flex items-center justify-between text-red-400 py-3 px-4 text-15 bg-white">
          <div className="flex items-center">
            <BiLogOutCircle className="text-24 mr-2 pr-2-px text-red-400" />
            退出账号
          </div>
          <MdChevronRight className="text-22 text-gray-d8" />
        </div>
      </div>
    </div>
  );
});
