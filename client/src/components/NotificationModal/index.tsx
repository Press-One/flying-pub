import React from 'react';
import { observer } from 'mobx-react-lite';
import DrawerModal from 'components/DrawerModal';
import Modal from 'components/Modal';
import { isMobile } from 'utils';
import { useStore } from 'store';

export default observer(() => {
  const { modalStore, settingsStore } = useStore();
  const { settings } = settingsStore;

  const renderMain = () => {
    return (
      <div>
        <div>
          <div className="p-8 p-12 bg-white md:rounded text-center main">
            <div className="text-lg font-bold text-gray-700 leading-none">通知设置</div>
            <div className="mt-6 text-gray-600">
              <div>
                在 Mixin 中搜索：<strong>{settings['notification.mixin.id']}</strong>
              </div>
              <div className="mt-3">点击发消息图标</div>
              <div className="mt-3">和机器人打声招呼</div>
              <div className="mt-3">收到成功提示，开通成功！</div>
              <div className="mt-3">如果你收到新消息</div>
              <div className="mt-3">机器人将会第一时间通知你</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <DrawerModal open={modalStore.notification.open} onClose={modalStore.closeNotification}>
        {renderMain()}
      </DrawerModal>
    );
  }

  return (
    <Modal open={modalStore.notification.open} onClose={modalStore.closeNotification}>
      {renderMain()}
    </Modal>
  );
});
