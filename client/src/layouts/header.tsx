import React from 'react';
import { observer } from 'mobx-react-lite';
import MenuIcon from '@material-ui/icons/Menu';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import People from '@material-ui/icons/People';
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet';
import NotificationsOutlined from '@material-ui/icons/NotificationsOutlined';
import NotificationModal from 'components/NotificationModal';
import Button from 'components/Button';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';
import HomeOutlined from '@material-ui/icons/HomeOutlined';
import ExitToApp from '@material-ui/icons/ExitToApp';
import OpenInNew from '@material-ui/icons/OpenInNew';
import { Settings } from '@material-ui/icons';
import Fade from '@material-ui/core/Fade';
import Drawer from '@material-ui/core/Drawer';
import Badge from '@material-ui/core/Badge';
import { Link } from 'react-router-dom';
import { useStore } from 'store';
import { getApiEndpoint, isMobile, sleep, stopBodyScroll, isPc } from 'utils';
import Img from 'components/Img';

export default observer((props: any) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [openDrawer, setOpenDrawer] = React.useState(false);
  const [showBack, setShowBack] = React.useState(false);
  const {
    preloadStore,
    userStore,
    modalStore,
    pathStore,
    settingsStore,
    notificationStore,
    confirmDialogStore,
    walletStore,
  } = useStore();
  const { settings } = settingsStore;
  const { pushPath, prevPath } = pathStore;
  const { user, isLogin } = userStore;
  const { pathname } = props.location;
  const unread = notificationStore.getUnread() || 0;

  const handleClose = () => setAnchorEl(null);

  const handleOpenLogin = () => {
    modalStore.openLogin();
  };

  React.useEffect(() => {
    pushPath(pathname);
    setShowBack(pathname !== '/');
  }, [pathname, pushPath]);

  if (!preloadStore.ready) {
    return isMobile ? <div className="h-12" /> : <div style={{ height: 53 }} />;
  }

  const logoutUrl = `${getApiEndpoint()}/api/logout?from=${window.location.origin}`;
  const supportPhoneBinding = !!settingsStore.settings['auth.providers']?.includes('phone');
  const phoneBinded = userStore.profiles.some((v) => v.provider === 'phone');

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
                  handleOpenLogin();
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
                  props.history.push(`/authors/${userStore.user.address}`);
                }}
              >
                我的主页
              </MenuItem>
              {walletStore.canSpendBalance && (
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
                  我的余额
                </MenuItem>
              )}
              <MenuItem
                onClick={async (e: React.MouseEvent) => {
                  setOpenDrawer(false);
                  stopBodyScroll(false);
                  await sleep(200);
                  confirmDialogStore.show({
                    content: '目前仅支持电脑端写文章哦',
                    cancelDisabled: true,
                    okText: '我知道了',
                    ok: () => {
                      confirmDialogStore.hide();
                    },
                  });
                }}
              >
                写文章
              </MenuItem>
              {walletStore.canSpendBalance && (
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
              )}
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
                {walletStore.rewardOnly ? '打赏' : '所有交易'}记录
              </MenuItem>
              <MenuItem
                onClick={async () => {
                  setOpenDrawer(false);
                  stopBodyScroll(false);
                  await sleep(200);
                  modalStore.openSettings('bind');
                }}
              >
                账号绑定
              </MenuItem>
              {supportPhoneBinding && phoneBinded && (
                <MenuItem
                  onClick={async () => {
                    setOpenDrawer(false);
                    stopBodyScroll(false);
                    await sleep(200);
                    modalStore.openSettings('password');
                  }}
                >
                  设置密码
                </MenuItem>
              )}
              <MenuItem
                onClick={async () => {
                  modalStore.openPageLoading();
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
        {userStore.isLogin && (
          <div>
            <Link to={`/authors/${user.address}`}>
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
                    我的主页
                  </div>
                </MenuItem>
              </div>
            </Link>
            <div
              onClick={() => {
                handleClose();
                walletStore.setFilterType('READER');
                modalStore.openWallet();
              }}
            >
              <MenuItem className="text-gray-700">
                <div className="py-1 flex items-center">
                  <span className="flex items-center text-xl mr-2">
                    <AccountBalanceWallet />
                  </span>{' '}
                  打赏{walletStore.rewardOnly ? '记录' : '钱包'}
                </div>
              </MenuItem>
            </div>
            <div>
              <MenuItem
                className="text-gray-700"
                onClick={() => {
                  handleClose();
                  modalStore.openSettings();
                }}
              >
                <div className="py-1 flex items-center">
                  <span className="flex items-center text-xl mr-2">
                    <Settings />
                  </span>{' '}
                  账号设置
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
    <Fade in={true} timeout={isMobile ? 400 : 1500}>
      <div>
        <div className="md:hidden">
          <div className="border-t border-gray-300 border-opacity-50" />
          <div className="flex justify-between items-center py-1 px-3 border-b border-gray-200 h-12">
            {!showBack && (
              <Link to="/">
                <div className="flex items-center">
                  <img
                    className="rounded-md"
                    src={settings['site.logo']}
                    alt="logo"
                    width="36"
                    height="36"
                  />
                </div>
              </Link>
            )}
            {showBack && (
              <div className="flex items-center">
                <div
                  className="flex items-center text-xl text-gray-700 p-2"
                  onClick={() => (prevPath ? props.history.goBack() : props.history.push('/'))}
                >
                  <ArrowBackIos />
                </div>
                <Link to="/" className="flex items-center text-28 text-gray-700 p-2 ml-2">
                  <HomeOutlined />
                </Link>
              </div>
            )}
            <div className="flex items-center">
              {isMobile && settings['notification.enabled'] && userStore.isLogin && (
                <Badge
                  badgeContent={unread}
                  className="mr-8 transform scale-90 cursor-pointer"
                  color="error"
                  onClick={() => {
                    modalStore.openNotification();
                  }}
                >
                  <div className="text-3xl flex items-center icon-btn-color">
                    <NotificationsOutlined />
                  </div>
                </Badge>
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
          </div>
          {isMobile && mobileMenuView()}
        </div>
        {isPc && (
          <div className="py-2 border-b border-gray-300">
            <div className="container mx-auto">
              <div className="w-916 mx-auto flex justify-between items-center">
                <Link to="/">
                  <div className="flex items-center">
                    <img
                      className="rounded-md"
                      src={settings['site.logo']}
                      alt="logo"
                      width="36"
                      height="36"
                    />
                  </div>
                </Link>
                {!userStore.isLogin && (
                  <Button
                    size="small"
                    onClick={() => {
                      handleClose();
                      handleOpenLogin();
                    }}
                  >
                    登录
                  </Button>
                )}
                {userStore.isLogin && (
                  <div className="flex items-center -mr-2">
                    {isPc && (
                      <Link to="/dashboard">
                        <Button size="small" className="mr-5">
                          写文章
                        </Button>
                      </Link>
                    )}
                    {settings['notification.enabled'] && (
                      <Badge
                        badgeContent={unread}
                        className="mr-4 transform scale-90 cursor-pointer"
                        color="error"
                        onClick={() => {
                          modalStore.openNotification();
                        }}
                      >
                        <div className="text-3xl flex items-center icon-btn-color">
                          <NotificationsOutlined />
                        </div>
                      </Badge>
                    )}
                    {isLogin && (
                      <div className="flex items-center pl-1 mr-3">
                        <Link to={`/authors/${user.address}`}>
                          <Img src={user.avatar} className="w-8 h-8 rounded-full" alt="头像" />
                        </Link>
                      </div>
                    )}
                    <IconButton onClick={(event: any) => setAnchorEl(event.currentTarget)}>
                      <MenuIcon />
                    </IconButton>
                    {pcMenuView()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {settings['notification.enabled'] && (
          <NotificationModal
            open={modalStore.notification.open}
            close={() => {
              modalStore.closeNotification();
              notificationStore.reset();
            }}
          />
        )}
        <style jsx>
          {`
            .icon-btn-color {
              color: rgba(0, 0, 0, 0.54);
            }
          `}
        </style>
        <style jsx global>{`
          .MuiIconButton-root {
            padding: 6px;
          }
        `}</style>
      </div>
    </Fade>
  );
});
