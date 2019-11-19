import React from 'react';
import { observer } from 'mobx-react-lite';
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet';
import AccountBalanceWalletRounded from '@material-ui/icons/AccountBalance';
import SettingsIcon from '@material-ui/icons/Settings';
import ReceiptIcon from '@material-ui/icons/Receipt';
import classNames from 'classnames';
import Badge from '@material-ui/core/Badge';
import { useStore } from 'store';
import Assets from './assets';
import Settings from './settings';
import Receipts from './receipts';
import Api from './api';

const Tab = (props: any) => {
  const { tab, thisTab, onClick } = props;
  const isActive = tab === thisTab;
  return (
    <div
      onClick={onClick}
      className={classNames(
        {
          'bg-blue-400': isActive,
          'text-white': isActive,
          'text-gray-700': !isActive,
        },
        'font-bold flex items-center px-2 py-2 mt-2 cursor-pointer rounded',
      )}
    >
      {props.children}
    </div>
  );
};

const TabContent = (props: any) => {
  return <div className="p-8">{props.children}</div>;
};

export default observer(() => {
  const { modalStore, walletStore } = useStore();
  const [tab, setTab] = React.useState(modalStore.wallet.data.tab || 'assets');

  React.useEffect(() => {
    (async () => {
      try {
        const isCustomPinExist = await Api.isCustomPinExist();
        walletStore.setIsCustomPinExist(isCustomPinExist);
      } catch (err) {}
      walletStore.setIsFetchedIsCustomPinExist(true);
    })();
  }, [walletStore]);

  return (
    <div className="relative text-gray-700">
      <div className="flex text-base">
        <div className="w-3/12 hidden md:block">
          <div className="py-8 px-6">
            <div className="font-bold flex items-center text-xl">
              <span className="text-2xl mr-2 flex items-center">
                <AccountBalanceWallet />
              </span>
              钱包
            </div>
            <div className="ml-2 mt-3">
              <Tab tab={tab} thisTab="assets" onClick={() => setTab('assets')}>
                <span className="text-lg mr-2 flex items-center">
                  <AccountBalanceWalletRounded />
                </span>
                资产
              </Tab>
              <Tab tab={tab} thisTab="settings" onClick={() => setTab('settings')}>
                <Badge
                  badgeContent={1}
                  className="pr-1"
                  color="error"
                  variant="dot"
                  invisible={!walletStore.isFetchedIsCustomPinExist || walletStore.isCustomPinExist}
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-2 flex items-center">
                      <SettingsIcon />
                    </span>
                    设置
                  </div>
                </Badge>
              </Tab>
              <Tab tab={tab} thisTab="receipts" onClick={() => setTab('receipts')}>
                <span className="text-lg mr-2 flex items-center">
                  <ReceiptIcon />
                </span>
                交易记录
              </Tab>
            </div>
          </div>
        </div>
        <div className="w-full md:w-9/12 md:border-l md:border-gray-400 wallet-content">
          {tab === 'assets' && (
            <TabContent>
              <div className="font-bold items-center text-xl flex justify-center md:justify-start">
                <span className="text-2xl mr-2 items-center hidden md:flex">
                  <AccountBalanceWalletRounded />
                </span>
                <span className="md:hidden">我的</span>资产
              </div>
              <div className="mt-4">
                <Assets setTab={setTab} />
              </div>
            </TabContent>
          )}
          {tab === 'settings' && (
            <TabContent>
              <div className="font-bold items-center text-xl flex justify-center md:justify-start">
                <span className="text-2xl mr-2 items-center hidden md:flex">
                  <SettingsIcon />
                </span>
                设置<span className="md:hidden">钱包</span>
              </div>
              <div className="mt-4">
                <Settings />
              </div>
            </TabContent>
          )}
          {tab === 'receipts' && (
            <TabContent>
              <div className="font-bold items-center text-xl flex justify-center md:justify-start">
                <span className="text-2xl mr-2 items-center hidden md:flex">
                  <ReceiptIcon />
                </span>
                交易记录
              </div>
              <div className="mt-4">
                <Receipts />
              </div>
            </TabContent>
          )}
        </div>
      </div>
    </div>
  );
});
