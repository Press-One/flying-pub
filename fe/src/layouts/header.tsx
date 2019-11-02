import React from 'react';
import { observer } from 'mobx-react-lite';
import MenuIcon from '@material-ui/icons/Menu';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet';
import AccountCircle from '@material-ui/icons/AccountCircle';
import ExitToApp from '@material-ui/icons/ExitToApp';
import { useStore } from 'store';
import { getApiEndpoint } from 'utils';

export default observer(() => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const handleClose = () => setAnchorEl(null);
  const { userStore, modalStore } = useStore();

  if (!userStore.isFetched) {
    return null;
  }

  return (
    <div className="container m-auto">
      <div className="relative">
        <div>
          <div className="absolute top-0 right-0 text-xl">
            <IconButton onClick={(event: any) => setAnchorEl(event.currentTarget)}>
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              getContentAnchorEl={null}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              {!userStore.isLogin && (
                <div
                  onClick={() => {
                    handleClose();
                    modalStore.openLogin();
                  }}
                >
                  <MenuItem className="text-gray-700 flex">
                    <span className="flex items-center text-xl mr-2">
                      <AccountCircle />
                    </span>{' '}
                    登陆
                    <span className="pr-2" />
                  </MenuItem>
                </div>
              )}
              {userStore.isLogin && (
                <div
                  onClick={() => {
                    handleClose();
                    modalStore.openWallet();
                  }}
                >
                  <MenuItem className="text-gray-700 flex">
                    <span className="flex items-center text-xl mr-2">
                      <AccountBalanceWallet />
                    </span>{' '}
                    我的钱包
                  </MenuItem>
                </div>
              )}
              {userStore.isLogin && (
                <a href={`${getApiEndpoint()}/api/logout?from=${window.location.origin}`}>
                  <MenuItem className="text-gray-700 flex">
                    <span className="flex items-center text-xl mr-2">
                      <ExitToApp />
                    </span>{' '}
                    登出
                  </MenuItem>
                </a>
              )}
            </Menu>
          </div>
        </div>
      </div>
    </div>
  );
});
