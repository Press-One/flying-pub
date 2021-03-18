import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  IoPersonOutline,
  IoPerson,
  IoChatbubbleEllipsesOutline,
  IoChatbubbleEllipses,
  IoHeartOutline,
  IoHeart,
} from 'react-icons/io5';
import { AiOutlineHome, AiFillHome } from 'react-icons/ai';
import Badge from '@material-ui/core/Badge';
import classNames from 'classnames';
import { useStore } from 'store';
import { useHistory, useLocation } from 'react-router-dom';

export default observer(() => {
  const { modalStore, userStore, preloadStore, notificationStore, settingsStore } = useStore();
  const { user, isLogin } = userStore;
  const history = useHistory();
  const { pathname } = useLocation();
  const unread = notificationStore.getUnread() || 0;
  const hidden = !(
    pathname === '/' ||
    (pathname.includes('/authors/') && isLogin && pathname.includes(user.address)) ||
    pathname.includes('/subscription')
  );

  if (hidden) {
    return null;
  }

  if (!preloadStore.ready) {
    return null;
  }

  return (
    <div>
      <div className="h-12 w-screen"></div>
      <div className="pt-2 fixed bottom-0 left-0 w-screen flex justify-around text-gray-88 text-12 border-t border-gray-ec bg-white z-50">
        <div
          className={classNames(
            {
              'text-blue-400': pathname === '/',
            },
            'px-4 text-center',
          )}
          onClick={() => {
            history.push('/');
          }}
        >
          <div className="flex items-center justify-center text-24 h-6 w-6">
            {pathname === '/' ? <AiFillHome /> : <AiOutlineHome />}
          </div>
          <div className="transform scale-90">首页</div>
        </div>
        <div
          className={classNames(
            {
              'text-blue-400': pathname === '/subscription',
            },
            'px-4 text-center',
          )}
          onClick={() => {
            if (!isLogin) {
              modalStore.openLogin();
              return;
            }
            history.push('/subscription');
          }}
        >
          <div className="flex items-center justify-center text-26 h-6 w-6">
            {pathname === '/subscription' ? <IoHeart /> : <IoHeartOutline />}
          </div>
          <div className="transform scale-90">关注</div>
        </div>
        {settingsStore.settings.extra['messageSystem.enabled'] && (
          <div
            className={classNames(
              {
                'text-blue-400': pathname === '/notification',
              },
              'px-4 text-center relative',
            )}
            onClick={() => {
              if (!isLogin) {
                modalStore.openLogin();
                return;
              }
              modalStore.openMixinNotification();
            }}
          >
            <div className="flex items-center justify-center text-23 h-6 w-6">
              {pathname === '/notification' ? (
                <IoChatbubbleEllipses />
              ) : (
                <IoChatbubbleEllipsesOutline />
              )}
            </div>
            <div className="transform scale-90">通知</div>
            <div className="absolute top-0 right-0">
              <Badge
                badgeContent={unread}
                className="-ml-8 pl-1 -mt-2 transform scale-90"
                color="error"
              />
            </div>
          </div>
        )}
        <div
          className={classNames(
            {
              'text-blue-400': pathname.startsWith('/authors'),
            },
            'px-4 text-center',
          )}
          onClick={() => {
            if (!isLogin) {
              modalStore.openLogin();
              return;
            }
            history.push(`/authors/${user.address}`);
          }}
        >
          <div className="flex items-center justify-center text-26 h-6 w-6">
            {pathname.startsWith('/authors') ? <IoPerson /> : <IoPersonOutline />}
          </div>
          <div className="transform scale-90">我的</div>
        </div>
      </div>
    </div>
  );
});
