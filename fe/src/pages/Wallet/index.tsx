import React from 'react';
import BackButton from 'components/BackButton';
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet';
import AccountBalanceWalletRounded from '@material-ui/icons/AccountBalance';
import SettingsIcon from '@material-ui/icons/Settings';
import ReceiptIcon from '@material-ui/icons/Receipt';
import classNames from 'classnames';
import Assets from './assets';
import Settings from './settings';
import Receipts from './receipts';

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

export default () => {
  const [tab, setTab] = React.useState('receipts');

  return (
    <div className="w-9/12 m-auto relative">
      <BackButton />
      <div className="flex text-base">
        <div className="w-3/12 border-r border-gray-400 min-h-screen">
          <div className="p-8">
            <div className="text-gray-700 font-bold flex items-center text-xl">
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
                <span className="text-lg mr-2 flex items-center">
                  <SettingsIcon />
                </span>
                设置
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
        <div className="w-9/12">
          {tab === 'assets' && (
            <TabContent>
              <div className="text-gray-700 font-bold flex items-center text-xl">
                <span className="text-2xl mr-2 flex items-center">
                  <AccountBalanceWalletRounded />
                </span>
                资产
              </div>
              <div className="mt-4">
                <Assets />
              </div>
            </TabContent>
          )}
          {tab === 'settings' && (
            <TabContent>
              <div className="text-gray-700 font-bold flex items-center text-xl">
                <span className="text-2xl mr-2 flex items-center">
                  <SettingsIcon />
                </span>
                设置
              </div>
              <div className="mt-4">
                <Settings />
              </div>
            </TabContent>
          )}
          {tab === 'receipts' && (
            <TabContent>
              <div className="text-gray-700 font-bold flex items-center text-xl">
                <span className="text-2xl mr-2 flex items-center">
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
};
