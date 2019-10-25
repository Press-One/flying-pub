import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
// import Loading from 'components/Loading';
import { assetIconMap } from './utils';
import FinanceApi from './api';

const assets = ['cnb', 'btc', 'eth', 'eos', 'box', 'prs', 'xin'];

const Asset = (asset: any, amount: number) => {
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
        <span className="text-blue-400 text-sm cursor-pointer p-1">转出</span>
      </div>
    </div>
  );
};

export default observer(() => {
  const { walletStore } = useStore();
  React.useEffect(() => {
    (async () => {
      try {
        const balance = await FinanceApi.getBalance();
        walletStore.setBalance(balance);
      } catch (err) {}
      walletStore.setIsFetched(true);
    })();
  }, [walletStore]);

  const { balance } = walletStore;

  // if (!isFetched) {
  //   return <Loading spaceSize="large" />;
  // }

  return (
    <div>
      {assets.map((asset: any) => {
        return <div key={asset}>{Asset(asset, balance[asset.toUpperCase()] || 0)}</div>;
      })}
    </div>
  );
});
