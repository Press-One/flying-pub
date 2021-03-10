import React from 'react';
import { observer } from 'mobx-react-lite';
import DrawerModal from 'components/DrawerModal';
import Modal from 'components/Modal';
import QRCode from 'qrcode.react';
import { isMobile, isWeChat } from 'utils';
import { useStore } from 'store';
import { MdInfo } from 'react-icons/md';

export default observer(() => {
  const { modalStore, settingsStore } = useStore();
  const { settings } = settingsStore;

  const renderMain = () => {
    if (!settings.extra['notification.mixinClientId']) {
      return null;
    }
    const botUrl = `https://mixin.one/apps/${settings.extra['notification.mixinClientId']}`;
    return (
      <div>
        <div>
          <div className="p-12 px-16 bg-white md:rounded-12 text-center main">
            <div className="text-lg font-bold text-gray-700 leading-none">
              开通 {settings['mixinApp.name']} 通知
            </div>
            <div className="mt-6 text-gray-600">
              {isWeChat && (
                <div>
                  在 {settings['mixinApp.name']} 中打开：
                  <span className="font-bold">{settings.extra['notification.mixinId']}</span>
                </div>
              )}
              {isMobile && !isWeChat && (
                <div>
                  在 {settings['mixinApp.name']} 中打开：
                  <a href={botUrl} className="font-bold text-blue-400">
                    {settings.extra['notification.mixinId']}
                  </a>
                </div>
              )}
              {!isMobile && (
                <div className="flex flex-col items-center mt-2">
                  <QRCode value={botUrl} />
                  <div className="mt-5">使用 {settings['mixinApp.name']} 扫码添加机器人</div>
                </div>
              )}
              <div className="mt-3">点击发消息图标</div>
              <div className="mt-3">和机器人打声招呼</div>
              <div className="mt-3">收到成功提示，开通成功！</div>
            </div>
            <div className="flex items-center justify-center mt-5 text-gray-500 text-xs">
              <span className="flex items-center text-lg mr-1">
                <MdInfo />
              </span>
              手机还没有安装 {settings['mixinApp.name']} ？
              {!isWeChat && (
                <a
                  className="text-blue-400"
                  href={settings['mixinApp.downloadUrl']}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  前往下载
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <DrawerModal
        open={modalStore.mixinNotification.open}
        onClose={modalStore.closeMixinNotification}
      >
        {renderMain()}
      </DrawerModal>
    );
  }

  return (
    <Modal open={modalStore.mixinNotification.open} onClose={modalStore.closeMixinNotification}>
      {renderMain()}
    </Modal>
  );
});
