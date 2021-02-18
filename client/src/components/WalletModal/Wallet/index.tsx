import React from 'react';
import { observer } from 'mobx-react-lite';
import { MdAccountBalanceWallet, MdSettings, MdReceipt } from 'react-icons/md';
import { BiWallet } from 'react-icons/bi';
import classNames from 'classnames';
import Badge from '@material-ui/core/Badge';
import { useStore } from 'store';
import { isPc, isMobile } from 'utils';
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
  const [tab, setTab] = React.useState(modalStore.wallet.data.tab || 'receipts');

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
                <MdAccountBalanceWallet />
              </span>
              打赏{walletStore.rewardOnly ? '记录' : '钱包'}
            </div>
            <div className="ml-2 mt-3">
              <Tab tab={tab} thisTab="assets" onClick={() => setTab('assets')}>
                <span className="text-lg mr-2 flex items-center">
                  <BiWallet />
                </span>
                余额
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
                      <MdSettings />
                    </span>
                    设置
                  </div>
                </Badge>
              </Tab>
              <Tab tab={tab} thisTab="receipts" onClick={() => setTab('receipts')}>
                <span className="text-lg mr-2 flex items-center">
                  <MdReceipt />
                </span>
                交易记录
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
          style={{
            height: isMobile ? 'auto' : '600px',
          }}
        >
          {!walletStore.rewardOnly && tab === 'assets' && (
            <TabContent>
              <div className="font-bold items-center text-xl flex justify-center md:justify-start">
                <span className="text-2xl mr-2 items-center hidden md:flex">
                  <BiWallet />
                </span>
                <span className="md:hidden">我的</span>余额
              </div>
              <div className="mt-4">
                <Assets setTab={setTab} />
              </div>
            </TabContent>
          )}
          {!walletStore.rewardOnly && tab === 'settings' && (
            <TabContent>
              <div className="font-bold items-center text-xl flex justify-center md:justify-start">
                <span className="text-2xl mr-2 items-center hidden md:flex">
                  <MdSettings />
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
                  <MdReceipt />
                </span>
                {walletStore.rewardOnly ? '打赏' : '交易'}记录
              </div>
              <div
                className={classNames(
                  {
                    'pt-2 mx-2': isPc && walletStore.rewardOnly,
                  },
                  'mt-4',
                )}
              >
                <Receipts />
              </div>
            </TabContent>
          )}
        </div>
      </div>
    </div>
  );
});
