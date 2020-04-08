import React from 'react';
import { observer } from 'mobx-react-lite';
import MenuIcon from '@material-ui/icons/Menu';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import People from '@material-ui/icons/People';
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet';
import Edit from '@material-ui/icons/Edit';
import AccountCircle from '@material-ui/icons/AccountCircle';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';
import ExitToApp from '@material-ui/icons/ExitToApp';
import OpenInNew from '@material-ui/icons/OpenInNew';
import Fade from '@material-ui/core/Fade';
import Drawer from '@material-ui/core/Drawer';
import { Link } from 'react-router-dom';
import { useStore } from 'store';
import {
  getApiEndpoint,
  getLoginUrl,
  isMobile,
  isWeChat,
  sleep,
  stopBodyScroll,
  isPc,
} from 'utils';

export default observer((props: any) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [openDrawer, setOpenDrawer] = React.useState(false);
  const [showBack, setShowBack] = React.useState(false);
  const { preloadStore, userStore, modalStore, pathStore, settingsStore } = useStore();
  const { settings } = settingsStore;
  const { pushPath, prevPath } = pathStore;
  const { pathname } = props.location;

  const handleClose = () => setAnchorEl(null);

  React.useEffect(() => {
    pushPath(pathname);
    setShowBack(pathname !== '/');
  }, [pathname, pushPath]);

  if (!preloadStore.ready) {
    return isMobile ? <div className="h-12" /> : null;
  }

  const logoutUrl = `${getApiEndpoint()}/api/logout?from=${window.location.origin}`;

  const mobileMenuView = () => {
    const MenuItem = (props: any) => {
      const { onClick } = props;
      return (
        <div
          className="py-4 text-black text-center border-b border-gray-300 bg-white text-lg"
          onClick={onClick}
        >
          {props.children}
        </div>
      );
    };
    return (
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
              <MenuItem
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
                登录
              </MenuItem>
            </div>
          )}
          {userStore.isLogin && (
            <div>
              <MenuItem
                onClick={async () => {
                  setOpenDrawer(false);
                  stopBodyScroll(false);
                  await sleep(200);
                  props.history.push('/subscriptions');
                }}
              >
                我的关注
              </MenuItem>
              {settings['pub.site.url'] && (
                <MenuItem
                  onClick={async () => {
                    setOpenDrawer(false);
                    stopBodyScroll(false);
                    await sleep(200);
                    window.location.href = settings['pub.site.url'];
                  }}
                >
                  写文章
                </MenuItem>
              )}
              <MenuItem
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
              </MenuItem>
              <MenuItem
                onClick={async () => {
                  setOpenDrawer(false);
                  stopBodyScroll(false);
                  await sleep(200);
                  modalStore.openWallet({
                    tab: 'settings',
                  });
                }}
              >
                设置密码
              </MenuItem>
              <MenuItem
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
              </MenuItem>
              <MenuItem
                onClick={async () => {
                  window.location.href = logoutUrl;
                }}
              >
                退出账号
              </MenuItem>
            </div>
          )}
          <div className="mt-1">
            <MenuItem
              onClick={() => {
                setOpenDrawer(false);
                stopBodyScroll(false);
              }}
            >
              取消
            </MenuItem>
          </div>
        </div>
      </Drawer>
    );
  };

  const pcMenuView = () => {
    return (
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
                  登录
                  <span className="pr-2" />
                </div>
              </MenuItem>
            </div>
            {settings['menu.links'].map((link: any) => {
              return (
                <div
                  key={link.name}
                  onClick={() => {
                    handleClose();
                    window.open(link.url);
                  }}
                >
                  <MenuItem className="text-gray-700">
                    <div className="py-1 flex items-center">
                      <span className="flex items-center text-xl mr-2">
                        <OpenInNew />
                      </span>{' '}
                      {link.name}
                      <span className="pr-2" />
                    </div>
                  </MenuItem>
                </div>
              );
            })}
          </div>
        )}
        {userStore.isLogin && (
          <div>
            {settings['subscriptions.enabled'] && (
              <Link to="/subscriptions">
                <div
                  onClick={() => {
                    handleClose();
                  }}
                >
                  <MenuItem className="text-gray-700">
                    <div className="py-1 flex items-center">
                      <span className="flex items-center text-xl mr-2">
                        <People />
                      </span>{' '}
                      我的关注
                    </div>
                  </MenuItem>
                </div>
              </Link>
            )}
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
            {settings['pub.site.url'] && (
              <div
                onClick={() => {
                  handleClose();
                  window.open(settings['pub.site.url']);
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
            )}
            {settings['menu.links'].map((link: any) => {
              return (
                <div
                  key={link.name}
                  onClick={() => {
                    handleClose();
                    window.open(link.url);
                  }}
                >
                  <MenuItem className="text-gray-700">
                    <div className="py-1 flex items-center">
                      <span className="flex items-center text-xl mr-2">
                        <OpenInNew />
                      </span>{' '}
                      {link.name}
                      <span className="pr-2" />
                    </div>
                  </MenuItem>
                </div>
              );
            })}
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
    );
  };

  return (
    <Fade in={true} timeout={isMobile ? 500 : 1500}>
      <div className="container m-auto">
        <div className="md:hidden">
          <div className="flex justify-between items-center py-1 px-3 border-t border-b border-gray-300 h-12">
            {!showBack && (
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
            )}
            {showBack && (
              <div
                className="flex items-center text-xl text-gray-700 p-2"
                onClick={() => (prevPath ? props.history.goBack() : props.history.push('/'))}
              >
                <ArrowBackIos />
              </div>
            )}
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
          {isMobile && mobileMenuView()}
        </div>
        {isPc && (
          <div className="w-7/12 m-auto relative">
            <div className="absolute top-0 right-0 text-xl mt-6 pt-2 -mr-20">
              <IconButton onClick={(event: any) => setAnchorEl(event.currentTarget)}>
                <MenuIcon />
              </IconButton>
              {pcMenuView()}
            </div>
          </div>
        )}
      </div>
    </Fade>
  );
});
