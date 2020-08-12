import React from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import Fade from '@material-ui/core/Fade';
import Loading from 'components/Loading';
import { currencyIconMap, getPostsSiteDomain } from './utils';
import FinanceApi from './api';
import { sleep, isMobile } from 'utils';
import { useStore } from 'store';

const getTypeName = (type: string) => {
  const map: any = {
    RECHARGE: '充值',
    WITHDRAW: '提现',
    REWARD: '打赏文章',
  };
  return map[type];
};

const Receipt = (receipt: any, postMap: any = {}, mixinWalletClientId: string) => {
  if (receipt.type === 'RECHARGE' && receipt.memo.includes('打赏文章')) {
    return null;
  }
  return (
    <div className="border-b border-gray-300 flex justify-between items-center py-3 px-2 leading-none">
      <div className="flex items-center text-gray-700 text-sm md:w-8/12">
        <div className="mr-4">
          <div className="w-10 h-10">
            <img
              className="w-10 h-10"
              src={currencyIconMap[receipt.currency]}
              alt={receipt.currency}
            />
          </div>
        </div>
        {getTypeName(receipt.type)}
        {receipt.type === 'REWARD' && (
          <a
            href={`${getPostsSiteDomain()}/posts/${receipt.objectRId}`}
            className="text-blue-400 ml-2 truncate w-6/12 hidden md:block"
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
              'text-green-400': mixinWalletClientId === receipt.toProviderUserId,
              'text-red-400': mixinWalletClientId === receipt.fromProviderUserId,
            },
            'font-bold text-lg mr-1',
          )}
        >
          {mixinWalletClientId === receipt.toProviderUserId && '+'}
          {mixinWalletClientId === receipt.fromProviderUserId && '-'}
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
  const { userStore, walletStore, feedStore } = useStore();
  const { mixinWalletClientId } = userStore.user;
  const { isFetchedReceipts, receipts, receiptLimit, hasMoreReceipt } = walletStore;

  React.useEffect(() => {
    (async () => {
      try {
        const receipts = await FinanceApi.getReceipts({
          offset: 0,
          limit: receiptLimit,
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
            height: ${isMobile ? '65vh' : 'auto'};
          }
        `}</style>
      </div>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <div className="root">
        {receipts.map((receipt: any) => (
          <div key={receipt.id}>{Receipt(receipt, feedStore.postMap, mixinWalletClientId)}</div>
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
        {receipts.length > 0 && !hasMoreReceipt && (
          <div className="text-gray-500 py-8 md:pb-2 text-center text-sm">没有更多了</div>
        )}
        {receipts.length === 0 && (
          <div className="text-gray-500 mt-32 text-center text-sm">暂时没有交易记录</div>
        )}
        <style jsx>{`
          .root {
            height: ${isMobile ? '65vh' : 'auto'};
          }
        `}</style>
      </div>
    </Fade>
  );
});
