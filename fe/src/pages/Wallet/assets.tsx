import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import WithdrawModal from './withdrawModal';
import { assets, assetIconMap } from './utils';
import FinanceApi from './api';

const Asset = (props: any) => {
  const { snackbarStore } = useStore();
  const { asset, amount } = props;
  const recharge = async () => {
    try {
      const { paymentUrl } = await FinanceApi.recharge({
        amount: 0.0001,
        currency: asset.toUpperCase(),
      });
      window.open(paymentUrl);
    } catch (err) {
      console.log(` ------------- err ---------------`, err);
    }
  };

  const onWithdraw = (currency: string) => {
    if (Number(amount) === 0) {
      snackbarStore.show({
        message: '没有余额可以提现哦',
      });
      return;
    }
    props.onWithdraw(currency);
  };

  return (
    <div className="flex items-center justify-between py-3 px-2 border-b border-gray-300 leading-none">
      <div className="flex items-center">
        <img src={assetIconMap[asset]} alt={asset} width="40" height="40" />
        <div className="flex items-center ml-4">
          <span className="font-bold mr-1 text-lg">{amount}</span>
          <span className="text-xs">{asset.toUpperCase()}</span>
        </div>
      </div>
      <div className="flex items-center">
        <span className="text-blue-400 text-sm mr-2 cursor-pointer p-1" onClick={recharge}>
          转入
        </span>
        <span
          className="text-blue-400 text-sm cursor-pointer p-1"
          onClick={() => onWithdraw(asset.toUpperCase())}
        >
          转出
        </span>
      </div>
    </div>
  );
};

export default observer(() => {
  const { userStore, walletStore } = useStore();
  const [currency, setCurrency] = React.useState('');
  const [openWithdrawModal, setOpenWithdrawModal] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const balance = await FinanceApi.getBalance();
        walletStore.setBalance(balance);
      } catch (err) {}
      walletStore.setIsFetched(true);
    })();
  }, [walletStore]);

  const onWithdraw = (currency: string) => {
    setCurrency(currency);
    setOpenWithdrawModal(true);
  };

  const { balance } = walletStore;

  return (
    <div>
      {assets.map((asset: any) => {
        return (
          <div key={asset}>
            <Asset
              asset={asset}
              amount={balance[asset.toUpperCase()] || 0}
              onWithdraw={(currency: string) => onWithdraw(currency)}
            />
          </div>
        );
      })}
      <WithdrawModal
        currency={currency}
        mixinAccount={userStore.mixinAccount}
        open={openWithdrawModal}
        onClose={() => setOpenWithdrawModal(false)}
      />
    </div>
  );
});
