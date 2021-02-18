import React from 'react';
import { observer } from 'mobx-react-lite';
import { MdChevronLeft } from 'react-icons/md';
import Button from 'components/Button';
import DrawerModal from 'components/DrawerModal';
import Modal from 'components/Modal';
import Fade from '@material-ui/core/Fade';
import Wallet from './Wallet';
import { useStore } from 'store';
import { isMobile } from 'utils';

export default observer(() => {
  const { modalStore, walletStore } = useStore();
  const { returnInfo } = modalStore.wallet.data;
  let isBalanceEnough = false;
  if (returnInfo) {
    const { requiredCurrency, requiredAmount } = returnInfo;
    isBalanceEnough = Number(walletStore.balance[requiredCurrency]) >= Number(requiredAmount);
  }

  const renderMain = () => {
    return (
      <div
        className="wallet-modal max-h-screen overflow-y-auto"
        style={{
          width: isMobile ? 'auto' : walletStore.rewardOnly ? '620px' : '860px',
        }}
      >
        <div
          className="wallet-modal-content relative overflow-y-auto"
          style={{
            height: isMobile ? 'auto' : '600px',
          }}
        >
          {modalStore.wallet.open && <Wallet />}
          {returnInfo && isBalanceEnough && walletStore.isCustomPinExist && (
            <Fade in={true} timeout={500}>
              <div className="absolute bottom-0 right-0 m-5">
                <Button onClick={modalStore.closeWallet}>
                  <div className="flex items-center">
                    <MdChevronLeft className="transform scale-150" />
                    <span className="ml-1">{returnInfo.text}</span>
                  </div>
                </Button>
              </div>
            </Fade>
          )}
        </div>

        <style jsx>{`
          .wallet-modal-content.md {
            height: 600px;
          }
        `}</style>
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
    <Modal open={modalStore.wallet.open} onClose={modalStore.closeWallet}>
      <div className="bg-white rounded-12">{renderMain()}</div>
    </Modal>
  );
});
