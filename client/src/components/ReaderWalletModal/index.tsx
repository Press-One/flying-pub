import React from 'react';
import { observer } from 'mobx-react-lite';
import DrawerModal from 'components/DrawerModal';
import Modal from 'components/Modal';
import Wallet from './Wallet';
import { useStore } from 'store';
import { isMobile } from 'utils';

export default observer(() => {
  const { preloadStore, readerWalletStore } = useStore();

  if (!preloadStore.ready) {
    return null;
  }

  const renderMain = () => {
    return (
      <div>
        <div
          className="wallet-modal max-h-screen overflow-y-auto"
          style={{
            width: isMobile ? 'auto' : readerWalletStore.rewardOnly ? '620px' : '860px',
          }}
        >
          <div
            className="wallet-modal-content relative overflow-y-auto"
            style={{
              height: isMobile ? 'auto' : '600px',
            }}
          >
            <Wallet />
          </div>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <DrawerModal
        open={true}
        onClose={() => {
          window.location.href = '/';
        }}
      >
        {renderMain()}
      </DrawerModal>
    );
  }

  return (
    <Modal
      open={true}
      onClose={() => {
        window.location.href = '/';
      }}
    >
      <div className="bg-white rounded-12">{renderMain()}</div>
    </Modal>
  );
});
