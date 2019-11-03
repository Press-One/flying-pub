import React from 'react';
import { observer } from 'mobx-react-lite';
import Modal from '@material-ui/core/Modal';
import Wallet from './Wallet';
import { useStore } from 'store';
import css from 'styled-jsx/css';

const style = css`
  .wallet-modal {
    width: 840px;
  }
  .wallet-modal-content,
  :global(.wallet-content) {
    height: 600px;
    overflow: auto;
  }
`;

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
        <style jsx>{style}</style>
      </div>
    </Modal>
  );
});
