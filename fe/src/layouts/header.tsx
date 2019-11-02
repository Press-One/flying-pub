import React from 'react';
import { observer } from 'mobx-react-lite';
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet';
import AccountCircle from '@material-ui/icons/AccountCircleOutlined';
import LoginModal from 'components/LoginModal';
import { Tooltip } from '@material-ui/core';
import { useStore } from 'store';

export default observer(() => {
  const [openLoginModal, setOpenLoginModal] = React.useState(false);
  const { userStore } = useStore();
  const { isFetched, isLogin } = userStore;

  if (!isFetched) {
    return null;
  }

  return (
    <div className="container m-auto">
      <div className="relative">
        <div className="absolute top-0 right-0">
          <div
            className="flex items-center text-5xl text-gray-700 cursor-pointer opacity-50"
            onClick={() => setOpenLoginModal(true)}
          >
            {isLogin && (
              <Tooltip placement="left" title="查看我的钱包">
                <AccountBalanceWallet />
              </Tooltip>
            )}
            {!isLogin && (
              <Tooltip placement="left" title="登陆">
                <AccountCircle />
              </Tooltip>
            )}
          </div>
          <LoginModal open={openLoginModal} onClose={() => setOpenLoginModal(false)} />
        </div>
      </div>
    </div>
  );
});
