import React from 'react';
import { assetIconMap } from './utils';
import FinanceApi from './api';

const assets = ['btc', 'eth', 'eos', 'box', 'prs', 'xin'];

const Asset = (asset: any) => {
  const recharge = async () => {
    try {
      const { paymentUrl } = await FinanceApi.recharge({
        amount: 1,
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
          <span className="font-bold mr-1 text-lg">{String(Math.random() * 3).slice(0, 5)}</span>
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

export default () => {
  return (
    <div>
      {assets.map((asset: any) => {
        return <div key={asset}>{Asset(asset)}</div>;
      })}
    </div>
  );
};
