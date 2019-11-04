import React from 'react';
import { observer } from 'mobx-react-lite';
import Modal from '@material-ui/core/Modal';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';
import Button from 'components/Button';
import Fade from '@material-ui/core/Fade';
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
  const { modalStore, walletStore } = useStore();
  const { returnInfo } = modalStore.wallet.data;
  let isBalanceEnough = false;
  if (returnInfo) {
    const { requiredAsset, requiredAmount } = returnInfo;
    console.log(` ------------- requiredAsset ---------------`, requiredAsset);
    console.log(` ------------- requiredAmount ---------------`, requiredAmount);
    console.log(` ------------- returnInfo.text ---------------`, returnInfo.text);
    isBalanceEnough = Number(walletStore.balance[requiredAsset]) >= Number(requiredAmount);
    console.log(` ------------- isBalanceEnough ---------------`, isBalanceEnough);
  }

  return (
    <Modal
      open={modalStore.wallet.open}
      onClose={modalStore.closeWallet}
      className="flex justify-center items-center"
    >
      <div className="wallet-modal max-h-screen overflow-auto">
        <div className="bg-white rounded wallet-modal-content relative">
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
        <style jsx>{style}</style>
      </div>
    </Modal>
  );
});
