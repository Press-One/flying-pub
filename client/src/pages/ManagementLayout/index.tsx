import React from 'react';
import { observer } from 'mobx-react-lite';
import { RouteChildrenProps, Route } from 'react-router';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import AccountCircle from '@material-ui/icons/AccountCircle';
import AssignmentIcon from '@material-ui/icons/Assignment';
import VerticalAlignTop from '@material-ui/icons/VerticalAlignTop';
import CreateIcon from '@material-ui/icons/Create';
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet';
import Fade from '@material-ui/core/Fade';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';
import Button from 'components/Button';
import { resizeImage } from 'utils';

import { useStore } from '../../store';

import './index.scss';
import Dashboard from '../Dashboard';
import BlockTopic from '../BlockTopic';
import PostManager from '../PostManager';
import Sticky from '../Sticky';

export default observer((props: RouteChildrenProps) => {
  const { preloadStore, userStore, settingsStore, walletStore, modalStore } = useStore();
  const { user } = userStore;
  const { settings } = settingsStore;

  if (userStore.isFetched && !userStore.isLogin) {
    props.history.push('/');
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
      path: '/blockTopic',
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
            <div className="px-4 flex items-center">
              <div className="w-10 h-10">
                <img className="w-10 h-10" src={settings['site.logo']} alt="logo" />
              </div>
              <div className="text-base font-bold ml-4 text-gray-700 flex items-center justify-center tracking-wide">
                创作文章
              </div>
            </div>
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
                <Link to={`/authors/${user.address}`}>
                  <div className="flex items-center flex-col justify-center">
                    <img
                      src={resizeImage(user.avatar, 180)}
                      className="w-16 h-16 rounded-full"
                      alt="头像"
                    />
                    <span className="dark-color text-md mt-2">{user.nickname}</span>
                  </div>
                </Link>
              )}
              <div className="mx-2 mb-3 mt-5">
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
          <Route path="/blockTopic" exact component={BlockTopic} />
          <Route path="/postManager" exact component={PostManager} />
          <Route path="/sticky" exact component={Sticky} />
        </main>
      </div>
    </Fade>
  );
});
