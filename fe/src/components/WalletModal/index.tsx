import React from 'react';
import { observer } from 'mobx-react-lite';
import Modal from '@material-ui/core/Modal';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';
import Button from 'components/Button';
import DrawerModal from 'components/DrawerModal';
import Fade from '@material-ui/core/Fade';
import Wallet from './Wallet';
import { useStore } from 'store';
import { isMobile } from 'utils';
import css from 'styled-jsx/css';

const styles = css`
  .wallet-modal {
    width: ${isMobile ? 'auto' : '840px'};
  }
  .wallet-modal-content,
  :global(.wallet-content) {
    height: ${isMobile ? 'auto' : '600px'};
    overflow: auto;
  }
`;

export default observer(() => {
  const { modalStore, walletStore } = useStore();
  const { returnInfo } = modalStore.wallet.data;
  let isBalanceEnough = false;
  if (returnInfo) {
    const { requiredAsset, requiredAmount } = returnInfo;
    isBalanceEnough = Number(walletStore.balance[requiredAsset]) >= Number(requiredAmount);
  }

  const renderMain = () => {
    return (
      <div className="wallet-modal max-h-screen overflow-auto">
        <div className="wallet-modal-content relative">
          <Wallet />
          {returnInfo && isBalanceEnough && walletStore.isCustomPinExist && (
            <Fade in={true} timeout={500}>
              <div className="absolute bottom-0 right-0 m-5">
                <Button onClick={modalStore.closeWallet}>
                  <div className="flex items-center">
                    <ArrowBackIos />
                    <span className="ml-1">{returnInfo.text}</span>
                  </div>
                </Button>
              </div>
            </Fade>
          )}
        </div>

        <style jsx>{styles}</style>
      </div>
    );
  };

  if (isMobile) {
    return (
      <DrawerModal open={modalStore.wallet.open} onClose={modalStore.closeWallet}>
        {renderMain()}
      </DrawerModal>
    );
  }

  return (
    <Modal
      open={modalStore.wallet.open}
      onClose={modalStore.closeWallet}
      className="flex justify-center items-center bg-white"
    >
      {renderMain()}
    </Modal>
  );
});
