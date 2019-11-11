import React from 'react';
import { observer } from 'mobx-react-lite';
import MenuIcon from '@material-ui/icons/Menu';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet';
import AccountCircle from '@material-ui/icons/AccountCircle';
import ExitToApp from '@material-ui/icons/ExitToApp';
import Fade from '@material-ui/core/Fade';
import Drawer from '@material-ui/core/Drawer';
import { Link } from 'react-router-dom';
import { useStore } from 'store';
import { getApiEndpoint, isMobile, sleep, getLoginUrl, setQuery, isWeChat } from 'utils';

export default observer(() => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [openDrawer, setOpenDrawer] = React.useState(false);
  const handleClose = () => setAnchorEl(null);
  const { userStore, feedStore, modalStore } = useStore();

  if (!userStore.isFetched || !feedStore.isFetched) {
    return <div className="h-12" />;
  }

  return (
    <Fade in={true} timeout={isMobile ? 0 : 1500}>
      <div className="container m-auto">
        <div className="md:hidden">
          <div className="flex justify-between items-center py-1 px-3 border-b border-gray-300 h-12">
            <Link to="/">
              <div className="flex items-center">
                <img
                  src="https://xue-images.pek3b.qingstor.com/1111-fly-pub.png"
                  alt="logo"
                  width="36"
                  height="36"
                />
                <span className="text-lg font-bold text-gray-700 ml-2">飞贴</span>
              </div>
            </Link>
            <div
              className="w-8 h-8 text-xl border border-gray-600 text-gray-600 flex justify-center items-center leading-none rounded"
              onClick={() => setOpenDrawer(true)}
            >
              <MenuIcon />
            </div>
          </div>
          <Drawer
            anchor="bottom"
            open={openDrawer}
            onClose={() => {
              setOpenDrawer(false);
            }}
          >
            <div>
              <div
                className="py-3 text-gray-700 text-center border-b border-gray-300 bg-white text-base"
                onClick={async () => {
                  setOpenDrawer(false);
                  if (isWeChat) {
                    const loginUrl = getLoginUrl();
                    setQuery({
                      loginUrl,
                    });
                  }
                  await sleep(500);
                  modalStore.openLogin();
                }}
              >
                登陆
              </div>
              <div className="py-3 text-gray-700 text-center border-b border-gray-300 bg-white text-base">
                我的资产
              </div>
              <div className="py-3 text-gray-700 text-center border-b border-gray-300 bg-white text-base">
                设置钱包
              </div>
              <div className="py-3 text-gray-700 text-center border-b border-gray-300 bg-white text-base">
                所有交易记录
              </div>
              <div
                className="mt-1 py-3 text-gray-700 text-center border-b border-gray-300 bg-white text-base"
                onClick={() => {
                  setOpenDrawer(false);
                }}
              >
                取消
              </div>
            </div>
          </Drawer>
          <style jsx global>{`
            .MuiPaper-root {
              background: none;
               {
                /* border-radius: 16px 16px 0 0; */
              }
            }
          `}</style>
        </div>
        <div className="hidden md:block w-7/12 m-auto relative">
          <div className="absolute top-0 right-0 text-xl mt-12 pt-2 -mr-20">
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
    </Fade>
  );
});
