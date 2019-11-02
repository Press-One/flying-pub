import React from 'react';
import { observer } from 'mobx-react-lite';
import Modal from '@material-ui/core/Modal';
import Wallet from './Wallet';
import { useStore } from 'store';

export default observer(() => {
  const { modalStore } = useStore();

  return (
    <Modal
      open={modalStore.wallet.open}
      onClose={modalStore.closeWallet}
      className="flex justify-center items-center"
    >
      <div className="wallet-modal max-h-screen overflow-auto">
        <div className="bg-white rounded wallet-modal-content">
          <Wallet />
        </div>
      </div>
    </Modal>
  );
});
