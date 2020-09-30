import React from 'react';
import { observer } from 'mobx-react-lite';
import Modal from 'components/Modal';
import DrawerModal from 'components/DrawerModal';
import Notification from './Notification';
import { isMobile } from 'utils';

export default observer((props: any) => {
  const { open, close } = props;

  if (isMobile) {
    return (
      <DrawerModal open={open} onClose={close}>
        <div className="notification-drawer-content bg-white rounded-sm pt-1 box-border">
          <Notification />
          <style jsx>{`
            .notification-drawer-content {
              height: 95vh;
            }
          `}</style>
        </div>
      </DrawerModal>
    );
  }

  return (
    <Modal open={open} onClose={close}>
      <div className="notification-modal-content bg-white rounded-sm">
        <Notification />
        <style jsx>{`
          .notification-modal-content {
            width: 700px;
            height: ${window.innerHeight > 700 + 100 ? '700px' : '90vh'};
          }
        `}</style>
      </div>
    </Modal>
  );
});
