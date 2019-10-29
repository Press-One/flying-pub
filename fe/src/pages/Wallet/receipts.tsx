import React from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import { assetIconMap } from './utils';
import FinanceApi from './api';
import { useStore } from 'store';

const getTypeName = (type: string) => {
  const map: any = {
    RECHARGE: '充值',
    WITHDRAW: '提现',
  };
  return map[type];
};

const Receipt = (receipt: any) => {
  return (
    <div className="flex justify-between items-center py-3 px-2 border-b border-gray-300 leading-none">
      <div className="flex items-center text-gray-700 text-sm">
        <img
          className="mr-4"
          src={assetIconMap[receipt.currency.toLowerCase()]}
          alt={receipt.currency}
          width="40"
          height="40"
        />
        {getTypeName(receipt.type)}
        {receipt.type === 'AWARD' && (
          <a href="mixin" className="text-blue-400 ml-2">
            {receipt.post}
          </a>
        )}
      </div>
      <div className="flex items-center">
        <span
          className={classNames(
            {
              'text-green-400': receipt.amount > 0,
              'text-red-400': receipt.amount < 0,
            },
            'font-bold text-lg mr-1',
          )}
        >
          {receipt.amount}
        </span>
        <span className="text-xs">{receipt.currency}</span>
      </div>
    </div>
  );
};

export default observer(() => {
  const { walletStore } = useStore();

  React.useEffect(() => {
    (async () => {
      try {
        const receipts = await FinanceApi.getReceipts();
        walletStore.setReceipts(receipts);
      } catch (err) {}
    })();
  }, [walletStore]);

  return (
    <div>
      {walletStore.receipts.map((receipt: any) => (
        <div key={receipt.id}>{Receipt(receipt)}</div>
      ))}
    </div>
  );
});
