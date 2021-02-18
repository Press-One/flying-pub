import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import Loading from 'components/Loading';
import Fade from '@material-ui/core/Fade';
import { MdInfo } from 'react-icons/md';
import RechargeModal from './rechargeModal';
import WithdrawModal from './withdrawModal';
import { currencyIconMap } from './utils';
import { sleep, isMobile, getApiEndpoint } from 'utils';
import Api from './api';
import Img from 'components/Img';

const Asset = (props: any) => {
  const { snackbarStore, walletStore } = useStore();
  const { isCustomPinExist } = walletStore;
  const { asset, amount } = props;

  const onWithdraw = (currency: string) => {
    if (!isCustomPinExist) {
      snackbarStore.show({
        message: '请先设置支付密码',
        type: 'error',
      });
      return;
    }
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
          <Img className="w-10 h-10" src={currencyIconMap[asset]} alt={asset} />
        </div>
        <div className="flex items-center ml-4">
          <span className="font-bold mr-1 text-lg">{amount}</span>
          <span className="text-xs font-bold">{asset}</span>
        </div>
      </div>
      <div className="flex items-center font-bold md:font-normal">
        {walletStore.canSpendBalance && (
          <span
            className="text-blue-400 text-sm mr-2 cursor-pointer p-1"
            onClick={() => props.onRecharge(asset)}
          >
            转入
          </span>
        )}
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
  const [openRechargeModal, setOpenRechargeModal] = React.useState(false);
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

  const onRecharge = (currency: string) => {
    setCurrency(currency);
    setOpenRechargeModal(true);
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

  const onCloseRechargeModal = async (isSuccess: boolean, message?: string) => {
    setOpenRechargeModal(false);
    if (isSuccess) {
      await fetchBalance();
      await sleep(500);
      snackbarStore.show({
        message: message || '转入成功',
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

  const { balance, hasBalance, isCustomPinExist } = walletStore;

  return (
    <Fade in={true} timeout={500}>
      <div className="root">
        {hasBalance && !isCustomPinExist && (
          <div className="flex justify-between p-3 border border-blue-400 text-blue-400 bg-blue-100 flex items-center rounded mb-2 text-sm">
            <div className="flex items-center">
              <span className="flex items-center mr-1 text-lg">
                <MdInfo />
              </span>
              <span className="hidden md:block">再去设置一下支付密码，你就可以提现余额啦</span>
              <span className="md:hidden">尚未设置支付密码</span>
            </div>
            <span
              className="text-blue-400 cursor-pointer font-bold pr-2"
              onClick={() => props.setTab('settings')}
            >
              去设置
            </span>
          </div>
        )}
        {settings['wallet.currencies'].map((asset: any) => {
          return (
            <div key={asset}>
              <Asset
                asset={asset}
                amount={balance[asset] || 0}
                onWithdraw={(currency: string) => onWithdraw(currency)}
                onRecharge={(currency: string) => onRecharge(currency)}
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
        <RechargeModal
          currency={currency}
          open={openRechargeModal}
          onClose={onCloseRechargeModal}
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
