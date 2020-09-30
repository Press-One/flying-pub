import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import Loading from 'components/Loading';
import Fade from '@material-ui/core/Fade';
import WithdrawModal from './withdrawModal';
import { currencyIconMap } from './utils';
import { sleep, isMobile, getApiEndpoint } from 'utils';
import Api from './api';

const Asset = (props: any) => {
  const { snackbarStore } = useStore();
  const { asset, amount } = props;

  const onWithdraw = (currency: string) => {
    if (Number(amount) === 0) {
      snackbarStore.show({
        message: '没有余额可以提现哦',
        type: 'error',
      });
      return;
    }
    props.onWithdraw(currency);
  };

  return (
    <div className="flex items-center justify-between py-3 px-2 border-b border-gray-300 leading-none">
      <div className="flex items-center">
        <div className="w-10 h-10">
          <img className="w-10 h-10" src={currencyIconMap[asset]} alt={asset} />
        </div>
        <div className="flex items-center ml-4">
          <span className="font-bold mr-1 text-lg">{amount}</span>
          <span className="text-xs font-bold">{asset}</span>
        </div>
      </div>
      <div className="flex items-center font-bold md:font-normal">
        <span
          className="text-blue-400 text-sm cursor-pointer p-1"
          onClick={() => onWithdraw(asset)}
        >
          转出
        </span>
      </div>
    </div>
  );
};

export default observer((props: any) => {
  const { userStore, walletStore, snackbarStore, settingsStore, confirmDialogStore } = useStore();
  const { settings } = settingsStore;
  const [currency, setCurrency] = React.useState('');
  const [openWithdrawModal, setOpenWithdrawModal] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const balance = await Api.getBalance();
        walletStore.setBalance(balance);
      } catch (err) {}
      await sleep(500);
      walletStore.setIsFetchedBalance(true);
    })();
  }, [walletStore]);

  const onWithdraw = (currency: string) => {
    if (!userStore.user.mixinAccount) {
      confirmDialogStore.show({
        contentClassName: 'text-left',
        content: `请先绑定一下 ${settings['mixinApp.name']} 的账户，提现的币将转入该账号`,
        okText: '去绑定',
        ok: async () => {
          confirmDialogStore.setLoading(true);
          window.location.href = `${getApiEndpoint()}/api/auth/mixin/bind?redirect=${encodeURIComponent(
            window.location.href,
          )}`;
        },
      });
      return;
    }
    setCurrency(currency);
    setOpenWithdrawModal(true);
  };

  const fetchBalance = async () => {
    try {
      walletStore.setIsFetchedBalance(false);
      const balance = await Api.getBalance();
      walletStore.setBalance(balance);
      walletStore.setIsFetchedBalance(true);
    } catch (err) {}
  };

  const onCloseWithdrawModal = async (isSuccess: boolean, message?: string) => {
    setOpenWithdrawModal(false);
    if (isSuccess) {
      await fetchBalance();
      await sleep(500);
      snackbarStore.show({
        message: message || '转出成功',
        duration: isMobile ? 2000 : 8000,
      });
    }
  };

  if (!walletStore.isFetchedBalance) {
    return (
      <div className="root">
        <div className="py-32">
          <Loading />
        </div>
        <style jsx>{`
          .root {
            height: 390px;
          }
        `}</style>
      </div>
    );
  }

  const { balance } = walletStore;

  return (
    <Fade in={true} timeout={500}>
      <div className="root">
        {settings['wallet.currencies'].map((asset: any) => {
          return (
            <div key={asset}>
              <Asset
                asset={asset}
                amount={balance[asset] || 0}
                onWithdraw={(currency: string) => onWithdraw(currency)}
              />
            </div>
          );
        })}
        <WithdrawModal
          currency={currency}
          mixinAccount={userStore.user.mixinAccount}
          open={openWithdrawModal}
          onClose={onCloseWithdrawModal}
        />
        <style jsx>{`
          .root {
            height: 390px;
          }
        `}</style>
      </div>
    </Fade>
  );
});
