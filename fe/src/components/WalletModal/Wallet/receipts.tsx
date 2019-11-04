import React from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import Fade from '@material-ui/core/Fade';
import { assetIconMap, getPostsSiteDomain } from './utils';
import FinanceApi from './api';
import { useStore } from 'store';

const getTypeName = (type: string) => {
  const map: any = {
    RECHARGE: '充值',
    WITHDRAW: '提现',
    REWARD: '打赏文章',
  };
  return map[type];
};

const Receipt = (receipt: any, postMap: any = {}) => {
  return (
    <div className="flex justify-between items-center py-3 px-2 border-b border-gray-300 leading-none">
      <div className="flex items-center text-gray-700 text-sm">
        <img
          className="mr-4"
          src={assetIconMap[receipt.currency]}
          alt={receipt.currency}
          width="40"
          height="40"
        />
        {getTypeName(receipt.type)}
        {receipt.type === 'REWARD' && (
          <a
            href={`${getPostsSiteDomain()}/posts/${receipt.objectRId}`}
            className="text-blue-400 ml-2 truncate w-64"
            target="_blank"
            rel="noopener noreferrer"
            title={(postMap[receipt.objectRId] || {}).title}
          >
            {(postMap[receipt.objectRId] || {}).title}
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
  const { walletStore, feedStore } = useStore();

  React.useEffect(() => {
    (async () => {
      try {
        const receipts = await FinanceApi.getReceipts({
          limit: 100,
        });
        walletStore.setReceipts(receipts);
      } catch (err) {}
    })();
  }, [walletStore]);

  return (
    <Fade in={true} timeout={500}>
      <div>
        {walletStore.receipts.map((receipt: any) => (
          <div key={receipt.id}>{Receipt(receipt, feedStore.postMap)}</div>
        ))}
      </div>
    </Fade>
  );
});
