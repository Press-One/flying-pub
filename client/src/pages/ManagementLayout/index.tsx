import React from 'react';
import { observer } from 'mobx-react-lite';
import { RouteChildrenProps, Route } from 'react-router';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import {
  MdAccountCircle,
  MdAssignment,
  MdVerticalAlignTop,
  MdCreate,
  MdSearch,
  MdAccountBalanceWallet,
  MdChevronLeft,
} from 'react-icons/md';
import Fade from '@material-ui/core/Fade';
import Button from 'components/Button';
import Img from 'components/Img';

import { useStore } from '../../store';

import './index.scss';
import Dashboard from '../Dashboard';
import BlockTopic from '../BlockTopic';
import PostManager from '../PostManager';
import Sticky from '../Sticky';
import SearchManager from '../SearchManager';

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
      icon: MdCreate,
      path: '/dashboard',
      show: true,
    },
    {
      text: '【管理后台】用户权限',
      icon: MdAccountCircle,
      path: '/blockTopic',
      show: user.isAdmin,
    },
    {
      text: '【管理后台】文章权限',
      icon: MdAssignment,
      path: '/postManager',
      show: user.isAdmin,
    },
    {
      text: '【管理后台】文章置顶',
      icon: MdVerticalAlignTop,
      path: '/sticky',
      show: user.isAdmin,
    },
    {
      text: '【管理后台】搜索服务',
      icon: MdSearch,
      path: '/searchManager',
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
                <Img
                  className="w-10 h-10"
                  src={settings['site.logo']}
                  useOriginalDefault
                  alt="logo"
                />
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
                    <Img
                      src={user.avatar}
                      resizeWidth={120}
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
                    <MdAccountBalanceWallet />
                  </div>
                  写作收入
                </Button>
              </div>
              <div className="mx-2 pb-5">
                <Link to="/">
                  <Button className="w-full" outline>
                    <MdChevronLeft className="transform scale-150 mr-3-px" /> 返回首页
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
          <Route path="/searchManager" exact component={SearchManager} />
        </main>
      </div>
    </Fade>
  );
});
