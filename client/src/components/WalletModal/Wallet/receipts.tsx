import React from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import Fade from '@material-ui/core/Fade';
import Loading from 'components/Loading';
import { currencyIconMap } from './utils';
import FinanceApi from './api';
import { sleep, isMobile, isPc } from 'utils';
import { useStore } from 'store';

const getTypeName = (type: string, isIncome: boolean) => {
  if (isIncome && type === 'REWARD') {
    return '收到打赏';
  }
  const map: any = {
    RECHARGE: '充值',
    WITHDRAW: '提现',
    REWARD: '打赏文章',
  };
  return map[type];
};

const Receipt = (receipt: any, mixinWalletClientId: string, showType = false) => {
  if (receipt.type === 'RECHARGE' && receipt.memo.includes('打赏文章')) {
    return null;
  }
  const isIncome = mixinWalletClientId === receipt.toProviderUserId;
  const isOutcome = mixinWalletClientId === receipt.fromProviderUserId;
  return (
    <div className="border-b border-gray-300 flex justify-between items-center py-3 px-2 leading-none -mx-2 md:mx-0">
      <div className="flex items-center text-gray-700 text-sm w-9/12 md:w-9/12">
        <div
          className={classNames({
            'mr-4': showType,
            'mr-2 pr-1': !showType,
          })}
        >
          <div className="w-10 h-10">
            <img
              className="w-10 h-10"
              src={currencyIconMap[receipt.currency]}
              alt={receipt.currency}
            />
          </div>
        </div>
        {showType && getTypeName(receipt.type, isIncome)}
        {receipt.type === 'REWARD' && (
          <a
            href={`/posts/${receipt.objectRId}`}
            className={classNames(
              {
                'ml-2 md:w-8/12 hidden md:block': showType,
                'w-9/12': !showType,
              },
              'text-blue-400 truncate',
            )}
            target="_blank"
            rel="noopener noreferrer"
            title={(receipt.file || {}).title}
          >
            {(receipt.file || {}).title}
          </a>
        )}
      </div>
      <div className="flex items-center">
        <span
          className={classNames(
            {
              'text-green-400': isIncome,
              'text-red-400': isOutcome,
            },
            'font-bold text-lg mr-1',
          )}
        >
          {isIncome && '+'}
          {isOutcome && '-'}
          {parseFloat(receipt.amount)}
        </span>
        <span className="text-xs font-bold">{receipt.currency}</span>
      </div>
    </div>
  );
};

export default observer(() => {
  const page = React.useRef(1);
  const [loading, setLoading] = React.useState(false);
  const { userStore, walletStore } = useStore();
  const { mixinWalletClientId } = userStore.user;
  const { isFetchedReceipts, receipts, receiptLimit, hasMoreReceipt } = walletStore;

  React.useEffect(() => {
    (async () => {
      try {
        const receipts = await FinanceApi.getReceipts({
          offset: 0,
          limit: receiptLimit,
          filterType: walletStore.filterType,
        });
        page.current += 1;
        await sleep(500);
        walletStore.setReceipts(receipts);
        walletStore.setIsFetchedReceipts(true);
      } catch (err) {}
    })();
  }, [walletStore, receiptLimit]);

  const loadMore = async () => {
    try {
      setLoading(true);
      const newReceipts = await FinanceApi.getReceipts({
        offset: (page.current - 1) * receiptLimit,
        limit: receiptLimit,
        filterType: walletStore.filterType,
      });
      page.current += 1;
      await sleep(500);
      walletStore.addReceipts(newReceipts);
      setLoading(false);
    } catch (err) {}
  };

  if (!isFetchedReceipts) {
    return (
      <div className="root">
        <div className="py-32">
          <Loading />
        </div>
        <style jsx>{`
          .root {
            height: ${isMobile ? '70vh' : 'auto'};
          }
        `}</style>
      </div>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <div className="root">
        {receipts.map((receipt: any) => (
          <div key={receipt.id}>
            {Receipt(receipt, mixinWalletClientId, walletStore.canSpendBalance || isPc)}
          </div>
        ))}
        {/* 用解决定位，解决移动端无法点击的问题 */}
        {hasMoreReceipt && (
          <div className="mt-5 pt-2 pb-12 relative">
            {!loading && (
              <div className="w-full absolute z-50 top-0 left-0" onClick={loadMore}>
                <div className="text-blue-400 cursor-pointer text-center">加载更多</div>
              </div>
            )}
            {loading && <Loading />}
          </div>
        )}
        {receipts.length > 10 && !hasMoreReceipt && (
          <div className="text-gray-500 py-8 md:pb-2 text-center text-sm">没有更多了</div>
        )}
        {receipts.length === 0 && (
          <div className="text-gray-500 pt-32 text-center text-sm">
            暂时没有{walletStore.rewardOnly ? '打赏' : '交易'}记录
          </div>
        )}
        <style jsx>{`
          .root {
            height: ${isMobile ? '70vh' : 'auto'};
          }
        `}</style>
      </div>
    </Fade>
  );
});
