import React from 'react';
import { observer } from 'mobx-react-lite';
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet';
import AccountBalanceWalletRounded from '@material-ui/icons/AccountBalance';
import classNames from 'classnames';
import { useStore } from 'store';
import Assets from './assets';

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
  const { walletStore } = useStore();
  const [tab, setTab] = React.useState('assets');

  return (
    <div className="relative text-gray-700">
      <div className="flex text-base">
        <div
          className={classNames(
            {
              'md:block': !walletStore.rewardOnly,
            },
            'w-3/12 hidden',
          )}
        >
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
                余额
              </Tab>
            </div>
          </div>
        </div>
        <div
          className={classNames(
            {
              'md:w-9/12': !walletStore.rewardOnly,
            },
            'w-full md:border-l md:border-gray-400 wallet-content',
          )}
        >
          {tab === 'assets' && (
            <TabContent>
              <div className="font-bold items-center text-xl flex justify-center md:justify-start">
                <span className="text-2xl mr-2 items-center hidden md:flex">
                  <AccountBalanceWalletRounded />
                </span>
                <span className="md:hidden">我的</span>余额
              </div>
              <div className="mt-4">
                <Assets setTab={setTab} />
              </div>
            </TabContent>
          )}
        </div>
      </div>
    </div>
  );
});
