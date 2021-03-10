import React from 'react';
import { observer } from 'mobx-react-lite';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {
  MdMoreHoriz,
  MdPeople,
  MdStar,
  MdAccountBalanceWallet,
  MdNotificationsNone,
  MdChevronLeft,
  MdExitToApp,
  MdOpenInNew,
  MdSettings,
} from 'react-icons/md';
import { HiOutlineHome } from 'react-icons/hi';
import Button from 'components/Button';
import Fade from '@material-ui/core/Fade';
import Badge from '@material-ui/core/Badge';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from 'store';
import { getApiEndpoint, isMobile, isPc } from 'utils';
import Img from 'components/Img';
import Search from './Search';
import classNames from 'classnames';

export default observer((props: any) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [showBack, setShowBack] = React.useState(false);
  const {
    preloadStore,
    userStore,
    modalStore,
    pathStore,
    settingsStore,
    notificationStore,
    walletStore,
    contextStore,
  } = useStore();
  const { settings } = settingsStore;
  const { pushPath, prevPath } = pathStore;
  const { user, isLogin } = userStore;
  const unread = notificationStore.getUnread() || 0;
  const location = useLocation();
  const pathname = location.pathname;
  const showSearchEntry = React.useMemo(() => {
    return pathname === '/' || pathname === '/search' || (isPc && pathname.includes('/authors/'));
  }, [pathname]);
  const { isMixinImmersive } = contextStore;

  React.useEffect(() => {
    pushPath(pathname);
    setShowBack(pathname !== '/');
  }, [pathname, pushPath]);

  if (
    isMobile &&
    (pathname.includes('/authors/') ||
      pathname.includes('/topics/') ||
      pathname.includes('/subscription'))
  ) {
    return null;
  }

  if (!preloadStore.ready) {
    return isMobile ? <div className="h-11" /> : <div style={{ height: 53 }} />;
  }

  const handleClose = () => setAnchorEl(null);

  const handleOpenLogin = () => {
    modalStore.openLogin();
  };

  const logoutUrl = `${getApiEndpoint()}/api/logout?from=${window.location.origin}`;

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
                    <span className="flex items-center text-xl mr-2 -mt-1-px">
                      <MdPeople />
                    </span>{' '}
                    我的主页
                  </div>
                </MenuItem>
              </div>
            </Link>
            <div
              onClick={() => {
                handleClose();
                modalStore.openFavorites();
              }}
            >
              <MenuItem className="text-gray-700">
                <div className="py-1 flex items-center">
                  <span className="flex items-center text-xl mr-2 -mt-1-px">
                    <MdStar />
                  </span>{' '}
                  我的收藏
                </div>
              </MenuItem>
            </div>
            <div
              onClick={() => {
                handleClose();
                walletStore.setFilterType('READER');
                modalStore.openWallet();
              }}
            >
              <MenuItem className="text-gray-700">
                <div className="py-1 flex items-center">
                  <span className="flex items-center text-xl mr-2 -mt-1-px">
                    <MdAccountBalanceWallet />
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
                  <span className="flex items-center text-xl mr-2 -mt-1-px">
                    <MdSettings />
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
                      <span className="flex items-center text-xl mr-2 -mt-1-px">
                        <MdOpenInNew />
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
                  <span className="flex items-center text-xl mr-2 -mt-1-px">
                    <MdExitToApp />
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
    <Fade in={true} timeout={isMobile ? 0 : 1500}>
      <div>
        {isMobile && (
          <div
            className={classNames({
              'fixed top-0 left-0 w-full': pathname === '/search',
            })}
          >
            <div
              className={classNames(
                {
                  'pt-1': !isMixinImmersive,
                  'border-b border-gray-200': showBack,
                  'h-11': !(pathname === '/' && !settings.extra['search.enabled']),
                },
                'flex justify-between items-center pb-1 px-3',
              )}
            >
              {!showBack && !userStore.isLogin && (
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
              {settings.extra['search.enabled'] && !showBack && userStore.isLogin && (
                <div>
                  <Link to={`/authors/${user.address}`}>
                    <Img
                      src={user.avatar}
                      className="w-8 h-8 rounded-full border border-gray-f2 mt-1-px"
                      alt="头像"
                    />
                  </Link>
                </div>
              )}

              <div className="flex-1 pr-2 pl-3">
                {settings.extra['search.enabled'] && showSearchEntry && <Search />}
              </div>

              {showBack && (
                <div className="flex items-center w-full mt-2-px">
                  <div
                    className="flex items-center text-gray-99 mr-2"
                    onClick={() => (prevPath ? props.history.goBack() : props.history.push('/'))}
                  >
                    <MdChevronLeft className="text-30 -ml-5" />
                  </div>
                  {prevPath && prevPath !== '/' && pathname !== '/settings' && (
                    <Link to="/" className="flex items-center text-24 text-gray-99 p-2 ml-2">
                      <HiOutlineHome />
                    </Link>
                  )}
                </div>
              )}
              {isMixinImmersive && <div className="pr-24" />}
            </div>
          </div>
        )}
        {isPc && (
          <div className="py-2 border-b border-gray-300 box-border header">
            <div className="container mx-auto">
              <div className="w-916 mx-auto flex justify-between items-center relative">
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
                  <div className="flex items-center">
                    {settings.extra['search.enabled'] && showSearchEntry && <Search />}
                    <Button
                      size="small"
                      onClick={() => {
                        handleClose();
                        handleOpenLogin();
                      }}
                    >
                      登录
                    </Button>
                  </div>
                )}
                {userStore.isLogin && (
                  <div className="flex items-center -mr-2">
                    {settings.extra['search.enabled'] && showSearchEntry && (
                      <div className="mt-2-px">
                        <Search />
                      </div>
                    )}
                    <div className="flex items-center">
                      {!userStore.user.notificationEnabled && (
                        <Badge
                          badgeContent={unread}
                          className="mr-8 transform scale-90 cursor-pointer mt-1-p"
                          color="error"
                          onClick={() => {
                            modalStore.openMixinNotification();
                          }}
                        >
                          <div className="text-3xl flex items-center text-gray-88">
                            <MdNotificationsNone />
                          </div>
                        </Badge>
                      )}
                      {(!settings['permission.isOnlyAdminCanPub'] ||
                        (settings['permission.isOnlyAdminCanPub'] && user.isAdmin)) && (
                        <Link to="/dashboard">
                          <Button size="small" className="mr-5">
                            写文章
                          </Button>
                        </Link>
                      )}
                      {isLogin && (
                        <div className="flex items-center pl-1 mr-3">
                          <Link to={`/authors/${user.address}`}>
                            <Img src={user.avatar} className="w-8 h-8 rounded-full" alt="头像" />
                          </Link>
                        </div>
                      )}
                      <IconButton onClick={(event: any) => setAnchorEl(event.currentTarget)}>
                        <MdMoreHoriz />
                      </IconButton>
                      {pcMenuView()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <style jsx global>{`
          .MuiIconButton-root {
            padding: 6px;
          }
        `}</style>
        <style jsx>{`
          .header {
            height: 53px;
          }
        `}</style>
      </div>
    </Fade>
  );
});
