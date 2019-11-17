import React from 'react';
import { observer } from 'mobx-react-lite';
import MenuIcon from '@material-ui/icons/Menu';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet';
import Edit from '@material-ui/icons/Edit';
import AccountCircle from '@material-ui/icons/AccountCircle';
import ExitToApp from '@material-ui/icons/ExitToApp';
import Chat from '@material-ui/icons/Chat';
import Fade from '@material-ui/core/Fade';
import Drawer from '@material-ui/core/Drawer';
import { Link } from 'react-router-dom';
import { useStore } from 'store';
import { getApiEndpoint, getLoginUrl, isMobile, isWeChat, sleep, stopBodyScroll } from 'utils';

export default observer(() => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [openDrawer, setOpenDrawer] = React.useState(false);
  const handleClose = () => setAnchorEl(null);
  const { userStore, feedStore, modalStore } = useStore();

  if (!feedStore.isFetched) {
    return isMobile ? <div className="h-12" /> : null;
  }

  const logoutUrl = `${getApiEndpoint()}/api/logout?from=${window.location.origin}`;

  const openIntercom = () => {
    (window as any).Intercom('show');
  };

  return (
    <Fade in={true} timeout={isMobile ? 500 : 1500}>
      <div className="container m-auto">
        <div className="md:hidden">
          <div className="flex justify-between items-center py-1 px-3 border-t border-b border-gray-300 h-12">
            <Link to="/">
              <div className="flex items-center">
                <img
                  src="https://xue-images.pek3b.qingstor.com/1111-fly-pub.png"
                  alt="logo"
                  width="36"
                  height="36"
                />
                <span className="text-lg font-bold text-gray-700 ml-2">飞帖</span>
              </div>
            </Link>
            <div
              className="w-8 h-8 text-xl border border-gray-600 text-gray-600 flex justify-center items-center leading-none rounded"
              onClick={() => {
                setOpenDrawer(true);
                stopBodyScroll(true);
              }}
            >
              <MenuIcon />
            </div>
          </div>
          <Drawer
            anchor="bottom"
            open={openDrawer}
            onClose={() => {
              setOpenDrawer(false);
              stopBodyScroll(false);
            }}
          >
            <div className="bg-gray-300 leading-none">
              {!userStore.isLogin && (
                <div>
                  <div
                    className="py-4 text-black text-center border-b border-gray-300 bg-white text-lg"
                    onClick={async () => {
                      setOpenDrawer(false);
                      stopBodyScroll(false);
                      await sleep(200);
                      if (isWeChat) {
                        modalStore.openLogin();
                      } else {
                        window.location.href = getLoginUrl();
                      }
                    }}
                  >
                    登陆
                  </div>
                  <div
                    className="py-4 text-black text-center border-b border-gray-300 bg-white text-lg"
                    onClick={async () => {
                      setOpenDrawer(false);
                      stopBodyScroll(false);
                      await sleep(200);
                      openIntercom();
                    }}
                  >
                    反馈/建议
                  </div>
                </div>
              )}
              {userStore.isLogin && (
                <div>
                  <div
                    className="py-4 text-black text-center border-b border-gray-300 bg-white text-lg"
                    onClick={async () => {
                      setOpenDrawer(false);
                      stopBodyScroll(false);
                      await sleep(200);
                      modalStore.openWallet({
                        tab: 'assets',
                      });
                    }}
                  >
                    我的资产
                  </div>
                  <div
                    className="py-4 text-black text-center border-b border-gray-300 bg-white text-lg"
                    onClick={async () => {
                      setOpenDrawer(false);
                      stopBodyScroll(false);
                      await sleep(200);
                      modalStore.openWallet({
                        tab: 'settings',
                      });
                    }}
                  >
                    设置钱包
                  </div>
                  <div
                    className="py-4 text-black text-center border-b border-gray-300 bg-white text-lg"
                    onClick={async () => {
                      setOpenDrawer(false);
                      stopBodyScroll(false);
                      await sleep(200);
                      modalStore.openWallet({
                        tab: 'receipts',
                      });
                    }}
                  >
                    所有交易记录
                  </div>
                  <div
                    className="py-4 text-black text-center border-b border-gray-300 bg-white text-lg"
                    onClick={async () => {
                      setOpenDrawer(false);
                      stopBodyScroll(false);
                      await sleep(200);
                      openIntercom();
                    }}
                  >
                    反馈/建议
                  </div>
                  <div
                    className="py-4 text-black text-center border-b border-gray-300 bg-white text-lg"
                    onClick={async () => {
                      window.location.href = logoutUrl;
                    }}
                  >
                    退出账号
                  </div>
                </div>
              )}
              <div
                className="mt-1 py-4 text-black text-center border-b border-gray-300 bg-white text-lg"
                onClick={() => {
                  setOpenDrawer(false);
                  stopBodyScroll(false);
                }}
              >
                取消
              </div>
            </div>
          </Drawer>
        </div>
        <div className="hidden md:block w-7/12 m-auto relative">
          <div className="absolute top-0 right-0 text-xl mt-6 pt-2 -mr-20">
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
                <div>
                  <div
                    onClick={() => {
                      handleClose();
                      modalStore.openLogin();
                    }}
                  >
                    <MenuItem className="text-gray-700">
                      <div className="py-1 flex items-center">
                        <span className="flex items-center text-xl mr-2">
                          <AccountCircle />
                        </span>{' '}
                        登陆
                        <span className="pr-2" />
                      </div>
                    </MenuItem>
                  </div>
                  <div
                    onClick={() => {
                      handleClose();
                      openIntercom();
                    }}
                  >
                    <MenuItem className="text-gray-700">
                      <div className="py-1 flex items-center">
                        <span className="flex items-center text-xl mr-2">
                          <Chat />
                        </span>{' '}
                        反馈/建议
                        <span className="pr-2" />
                      </div>
                    </MenuItem>
                  </div>
                </div>
              )}
              {userStore.isLogin && (
                <div>
                  <div
                    onClick={() => {
                      handleClose();
                      modalStore.openWallet();
                    }}
                  >
                    <MenuItem className="text-gray-700">
                      <div className="py-1 flex items-center">
                        <span className="flex items-center text-xl mr-2">
                          <AccountBalanceWallet />
                        </span>{' '}
                        我的钱包
                      </div>
                    </MenuItem>
                  </div>
                  <div
                    onClick={() => {
                      handleClose();
                      window.open(process.env.REACT_APP_PUB_URL);
                    }}
                  >
                    <MenuItem className="text-gray-700">
                      <div className="py-1 flex items-center">
                        <span className="flex items-center text-xl mr-2">
                          <Edit />
                        </span>{' '}
                        写文章
                      </div>
                    </MenuItem>
                  </div>
                  <div
                    onClick={() => {
                      handleClose();
                      openIntercom();
                    }}
                  >
                    <MenuItem className="text-gray-700">
                      <div className="py-1 flex items-center">
                        <span className="flex items-center text-xl mr-2">
                          <Chat />
                        </span>{' '}
                        反馈/建议
                        <span className="pr-2" />
                      </div>
                    </MenuItem>
                  </div>
                  <a href={logoutUrl}>
                    <MenuItem className="text-gray-700">
                      <div className="py-1 flex items-center">
                        <span className="flex items-center text-xl mr-2">
                          <ExitToApp />
                        </span>{' '}
                        退出账号
                        <span className="pr-2" />
                      </div>
                    </MenuItem>
                  </a>
                </div>
              )}
            </Menu>
          </div>
        </div>
      </div>
    </Fade>
  );
});
