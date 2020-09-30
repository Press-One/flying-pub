import React from 'react';
import { observer } from 'mobx-react-lite';
import { RouteChildrenProps, Route } from 'react-router';
import { Tooltip } from '@material-ui/core';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import AccountCircle from '@material-ui/icons/AccountCircle';
import AssignmentIcon from '@material-ui/icons/Assignment';
import VerticalAlignTop from '@material-ui/icons/VerticalAlignTop';
import CreateIcon from '@material-ui/icons/Create';
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet';
import Settings from '@material-ui/icons/Settings';
import ChromeReaderMode from '@material-ui/icons/ChromeReaderMode';
import Help from '@material-ui/icons/Help';
import Fade from '@material-ui/core/Fade';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';
import Button from 'components/Button';

import { useStore } from '../../store';

import './index.scss';
import Dashboard from '../Dashboard';
import Topic from '../Topic';
import PostManager from '../PostManager';
import Sticky from '../Sticky';

export default observer((props: RouteChildrenProps) => {
  const { preloadStore, userStore, settingsStore, walletStore, modalStore } = useStore();
  const { user } = userStore;
  const { settings } = settingsStore;

  if (userStore.isFetched && !userStore.isLogin) {
    modalStore.openLogin();
  }

  const navList = [
    {
      text: '文章',
      icon: CreateIcon,
      path: '/dashboard',
      show: true,
    },
    {
      text: '【管理后台】用户权限',
      icon: AccountCircle,
      path: '/topic',
      show: user.isAdmin,
    },
    {
      text: '【管理后台】文章权限',
      icon: AssignmentIcon,
      path: '/postManager',
      show: user.isAdmin,
    },
    {
      text: '【管理后台】文章置顶',
      icon: VerticalAlignTop,
      path: '/sticky',
      show: user.isAdmin,
    },
  ];

  return (
    <Fade in={true} timeout={500}>
      <div className="p-manage-layout flex">
        <nav className="p-manage-layout-nav flex flex-col justify-between border-r relative">
          <section
            className={classNames(
              {
                invisible: !preloadStore.ready,
              },
              'pt-4 w-full',
            )}
          >
            {!settingsStore.settings['SSO.enabled'] && (
              <div>
                <div className="px-4 flex items-center">
                  <div className="w-10 h-10">
                    <img
                      className="w-10 h-10"
                      src="https://img-cdn.xue.cn/1124-logo.png"
                      alt="logo"
                    />
                  </div>
                  {settings['site.shortTitle'] && (
                    <span className="text-base font-bold ml-4 text-gray-700 flex items-center">
                      {settings['site.shortTitle']}
                      <Tooltip placement="right" title="写文章，一键发布到区块链">
                        <Help className="ml-1 text-gray-600" />
                      </Tooltip>
                    </span>
                  )}
                </div>
                <div className="mt-8 mx-2 pl-8 flex items-center leading-none">
                  <a
                    href={settingsStore.settings['site.url']}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Tooltip placement="right" title="已发布的文章，会在阅读站显示">
                      <div className="text-xl text-gray-600 py-2 flex items-center">
                        <ChromeReaderMode />
                        <span className="text-sm ml-2">阅读站</span>
                      </div>
                    </Tooltip>
                  </a>
                </div>
              </div>
            )}
            {settingsStore.settings['SSO.enabled'] && (
              <div className="px-4 flex items-center">
                <div className="w-10 h-10">
                  <img
                    className="w-10 h-10"
                    src="https://img-cdn.xue.cn/1124-logo.png"
                    alt="logo"
                  />
                </div>
                <div className="text-base font-bold ml-4 text-gray-700 flex items-center justify-center tracking-wide">
                  创作文章
                </div>
              </div>
            )}
            <ul className="p-manage-layout-nav-ul">
              <li className="px-5 mt-8 p-manage-layout-nav-ul-title p-manage-layout-nav-li text-sm text-gray-700 font-bold">
                管理
              </li>
              {navList
                .filter((v) => v.show)
                .map((item) => (
                  <li key={item.text} className="p-manage-layout-nav-li">
                    <div
                      onClick={() => props.history.push(item.path)}
                      className={classNames(
                        {
                          'bg-gray-200': props.location.pathname === item.path,
                        },
                        'mx-2 pl-8 flex items-center text-lg text-gray-600 py-3 mt-1 rounded cursor-pointer leading-none',
                      )}
                    >
                      <item.icon />
                      <span className="text-sm ml-2">{item.text}</span>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
          {
            <div className="w-full absolute bottom-0 left-0">
              {userStore.isFetched && (
                <div className="flex items-center flex-col justify-center">
                  <img src={user.avatar} className="w-16 h-16 rounded-full" alt="头像" />
                  <span className="dark-color text-md mt-2">{user.nickname}</span>
                </div>
              )}
              <div className="mx-2 mb-3 mt-5">
                <Button className="w-full" onClick={() => modalStore.openSettings()}>
                  <div className="flex items-center text-lg mr-1">
                    <Settings />
                  </div>
                  账号设置
                </Button>
              </div>
              <div className="mx-2 mb-3">
                <Button
                  className="w-full"
                  onClick={() => {
                    walletStore.setFilterType('AUTHOR');
                    modalStore.openWallet({
                      tab: 'assets',
                    });
                  }}
                >
                  <div className="flex items-center text-lg mr-1">
                    <AccountBalanceWallet />
                  </div>
                  写作收入
                </Button>
              </div>
              <div className="mx-2 pb-5">
                <Link to="/">
                  <Button className="w-full" outline>
                    <ArrowBackIos /> 返回首页
                  </Button>
                </Link>
              </div>
            </div>
          }
        </nav>
        <main className="p-manage-layout-main flex flex-col">
          <Route path="/dashboard" exact component={Dashboard} />
          <Route path="/topic" exact component={Topic} />
          <Route path="/postManager" exact component={PostManager} />
          <Route path="/sticky" exact component={Sticky} />
        </main>
      </div>
    </Fade>
  );
});
