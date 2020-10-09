import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../../store';
import { NotificationSubType } from '../../../store/notification';
import { getNotificationHistory } from '../../NotificationSocket';
import Loading from 'components/Loading';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Badge } from '@material-ui/core';
import PhonelinkRing from '@material-ui/icons/PhonelinkRing';
import NotificationMessages from './NotificationMessages';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import NotificationsOutlined from '@material-ui/icons/NotificationsOutlined';
import { sleep, isPc, isMobile } from 'utils';
import './index.scss';

export default observer(() => {
  const { notificationStore, modalStore, userStore } = useStore();
  const [page, setPage] = React.useState(0);
  const [tabValue, setTabvalue] = React.useState(0);

  const tabs = [
    NotificationSubType.LIKE,
    NotificationSubType.ARTICLE_COMMENT,
    NotificationSubType.COMMENT_MENTION_ME,
    NotificationSubType.ARTICLE_REWARD,
  ];

  const tabToTitle: any = {
    [NotificationSubType.ARTICLE_COMMENT]: '评论',
    [NotificationSubType.COMMENT_MENTION_ME]: '@我',
    [NotificationSubType.LIKE]: '赞',
    [NotificationSubType.ARTICLE_REWARD]: '打赏',
  };

  const renderTabLabel = (tab: NotificationSubType) => {
    return (
      <div className="relative">
        <div className="absolute top-0 right-0 -mt-2 -mr-2">
          <Badge
            badgeContent={notificationStore.summary[tab] || 0}
            className="transform scale-75 cursor-pointer"
            color="error"
          />
        </div>
        {tabToTitle[tab]}
      </div>
    );
  };

  const handleTabChange = (e: any, newValue: any) => {
    if (notificationStore.loading) {
      return;
    }
    setTabvalue(newValue);
    setPage(0);
    notificationStore.setSubType(tabs[newValue]);
    notificationStore.setIsFetched(false);
    notificationStore.setMessages([]);
  };

  const infiniteRef: any = useInfiniteScroll({
    loading: notificationStore.loading,
    hasNextPage: notificationStore.hasMore,
    scrollContainer: 'parent',
    threshold: 350,
    onLoadMore: () => {
      setPage(page + 1);
    },
  });

  React.useEffect(() => {
    (async () => {
      if (!notificationStore.connected) {
        await sleep(2000);
        if (!notificationStore.connected) {
          return;
        }
      }
      getNotificationHistory(notificationStore.subType, page, notificationStore);
    })();
    // eslint-disable-next-line
  }, [page, notificationStore.subType, notificationStore.connected]);

  const mixinProfile = userStore.profiles.find((v) => v.provider === 'mixin');

  return (
    <div className="notification-content">
      <div className="m-auto border-b border-gray-300 notification-header relative">
        {isPc && mixinProfile && !userStore.user.notificationEnabled && (
          <div
            className="absolute top-0 right-0 p-4 mr-2 text-blue-400 cursor-pointer z-10 flex items-center mt-12"
            onClick={() => {
              modalStore.openMixinNotification();
            }}
          >
            <div className="text-xl mr-1 flex items-center">
              <NotificationsOutlined />
            </div>
            开启手机通知
          </div>
        )}
        <Tabs value={tabValue} onChange={handleTabChange} className="relative">
          {tabs.map((tab: string, idx: number) => {
            return (
              <Tab key={idx} label={renderTabLabel(tab as NotificationSubType)} aria-label={tab} />
            );
          })}
        </Tabs>
        {isMobile && mixinProfile && !userStore.user.notificationEnabled && (
          <div
            className="text-2xl text-blue-400 fixed bottom-0 right-0 mr-4 mb-4 z-10 border border-blue-400 rounded-full flex items-center justify-center w-10 h-10"
            onClick={() => {
              modalStore.openMixinNotification();
            }}
          >
            <PhonelinkRing />
          </div>
        )}
      </div>
      <div className="px-4 md:px-8 notification-container">
        <div ref={infiniteRef}>
          {notificationStore.isFetched && <NotificationMessages />}
          {!notificationStore.isFetched && <div className="pt-20" />}
          {notificationStore.loading && (
            <div className="pt-10" style={{ height: '100px' }}>
              <Loading />
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        .notification-content .MuiTab-root {
          padding: 12px 12px;
          color: rgba(0, 0, 0, 0.54);
          font-size: 16px;
          line-height: 28px;
        }
        .notification-content .MuiTab-textColorInherit.Mui-selected {
          color: #63b3ed;
        }
        .notification-container {
          max-height: ${isPc ? (window.innerHeight > 700 + 100 ? '630px' : '80vh') : '85vh'};
          overflow: auto;
        }
        .notification-header {
          height: 50px;
        }
      `}</style>
    </div>
  );
});
