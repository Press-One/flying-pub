import React from 'react';
import { observer } from 'mobx-react-lite';
import Modal from 'components/Modal';
import DrawerModal from 'components/DrawerModal';
import Notification from './Notification';
import { isMobile } from 'utils';
import classNames from 'classnames';
import { useStore } from 'store';
import { ExtraNotificationType } from 'store/notification';

export default observer(() => {
  const { socketStore, notificationStore, modalStore, settingsStore } = useStore();
  const { settings } = settingsStore;
  const { open } = modalStore.notification;

  React.useEffect(() => {
    if (socketStore.isReady) {
      socketStore.on('TOPIC_CONTRIBUTION_REQUEST_PENDING_COUNT', (data: any) => {
        notificationStore.updateSummary({
          [ExtraNotificationType.TOPIC_REVIEW_REQUEST]: data.count || 0,
        });
      });
    }
  }, [socketStore, socketStore.isReady, notificationStore]);

  if (!settings.extra['messageSystem.enabled']) {
    return null;
  }

  const close = () => {
    modalStore.closeNotification();
    notificationStore.reset();
  };

  if (isMobile) {
    return (
      <DrawerModal open={open} onClose={close}>
        <div className="notification-drawer-content bg-white rounded-sm pt-1 box-border">
          <Notification />
          <style jsx>{`
            .notification-drawer-content {
              height: 92vh;
            }
          `}</style>
        </div>
      </DrawerModal>
    );
  }

  return (
    <Modal open={open} onClose={close}>
      <div
        className={classNames(
          {
            md: window.innerHeight > 700 + 100,
          },
          'notification-modal-content bg-white rounded-12',
        )}
      >
        <Notification />
        <style jsx>{`
          .notification-modal-content {
            width: 700px;
            height: 90vh;
          }
          .notification-modal-content.md {
            height: 700px;
          }
        `}</style>
      </div>
    </Modal>
  );
});
