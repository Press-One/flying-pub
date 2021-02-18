import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { useStore } from 'store';
import {
  NotificationSubType,
  CombinedNotificationType,
  ExtraNotificationType,
} from 'store/notification';
import { getNotificationHistory } from '../../NotificationSocket';
import Loading from 'components/Loading';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Badge } from '@material-ui/core';
import { MdPhonelinkRing, MdNotificationsNone } from 'react-icons/md';
import NotificationMessages from './NotificationMessages';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import { isPc, isMobile } from 'utils';
import classNames from 'classnames';
import TopicReviewRequest from './TopicReviewRequest';
import './index.scss';

const tabs = [
  NotificationSubType.LIKE,
  NotificationSubType.ARTICLE_COMMENT,
  NotificationSubType.COMMENT_MENTION_ME,
  CombinedNotificationType.OTHERS,
  ExtraNotificationType.TOPIC_REVIEW_REQUEST,
];

const tabToTitle: any = {
  [NotificationSubType.ARTICLE_COMMENT]: '评论',
  [NotificationSubType.COMMENT_MENTION_ME]: '回复',
  [NotificationSubType.LIKE]: '赞',
  [CombinedNotificationType.OTHERS]: '其他',
  [ExtraNotificationType.TOPIC_REVIEW_REQUEST]: isMobile ? '投稿' : '投稿请求',
};

export default observer(() => {
  const { notificationStore, modalStore, userStore } = useStore();
  const state = useLocalStore(() => ({
    page: 0,
    tabValue: modalStore.notification.data.tab || 0,
    get subTypes() {
      const subTypes: NotificationSubType[] = [];
      if (tabs[this.tabValue] === CombinedNotificationType.OTHERS) {
        subTypes.push(...notificationStore.othersSubTypes);
      } else {
        subTypes.push(tabs[this.tabValue] as NotificationSubType);
      }
      return subTypes;
    },
  }));

  React.useEffect(() => {
    notificationStore.setSubTypes(state.subTypes);
    notificationStore.setIsFetched(false);
    notificationStore.setMessages([]);
    // eslint-disable-next-line
  }, [state.subTypes]);

  const renderTabLabel = (tab: string) => {
    if (!userStore.user.topicReviewEnabled && tab === ExtraNotificationType.TOPIC_REVIEW_REQUEST) {
      return null;
    }
    let unread = 0;
    if (tab === CombinedNotificationType.OTHERS) {
      for (const type of notificationStore.othersSubTypes) {
        unread += notificationStore.summary[type] || 0;
      }
    } else {
      unread = notificationStore.summary[tab] || 0;
    }
    return (
      <div className="relative">
        <div className="absolute top-0 right-0 -mt-2 -mr-2">
          <Badge
            badgeContent={unread || 0}
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
    state.tabValue = newValue;
    state.page = 0;
  };

  const infiniteRef: any = useInfiniteScroll({
    loading: notificationStore.loading,
    hasNextPage: notificationStore.hasMore,
    scrollContainer: 'parent',
    threshold: 350,
    onLoadMore: () => {
      state.page += 1;
    },
  });

  React.useEffect(() => {
    (async () => {
      if (notificationStore.connected && modalStore.notification.open) {
        getNotificationHistory(notificationStore.subTypes, state.page, notificationStore);
      }
    })();
    // eslint-disable-next-line
  }, [
    state.page,
    notificationStore.subTypes,
    notificationStore.connected,
    modalStore.notification.open,
  ]);

  const mixinProfile = userStore.profiles.find((v) => v.provider === 'mixin');

  return (
    <div className="notification-content">
      <div className="m-auto md:border-b md:border-gray-300 notification-header relative">
        {isPc && mixinProfile && !userStore.user.notificationEnabled && (
          <div
            className="absolute top-0 right-0 p-4 mr-2 text-blue-400 cursor-pointer z-10 flex items-center mt-12"
            onClick={() => {
              modalStore.openMixinNotification();
            }}
          >
            <div className="text-xl mr-1 flex items-center">
              <MdNotificationsNone />
            </div>
            开启手机通知
          </div>
        )}
        <Tabs
          value={state.tabValue}
          onChange={handleTabChange}
          className={classNames(
            {
              sm: isMobile,
              'four-columns': !userStore.user.topicReviewEnabled,
            },
            'relative notification-filter-tabs',
          )}
        >
          {tabs.map((tab: string, idx: number) => {
            return <Tab key={idx} label={renderTabLabel(tab as string)} aria-label={tab} />;
          })}
        </Tabs>
        {isMobile && mixinProfile && !userStore.user.notificationEnabled && (
          <div
            className="text-2xl text-blue-400 fixed bottom-0 right-0 mr-4 mb-4 z-10 border border-blue-400 rounded-full flex items-center justify-center w-10 h-10"
            onClick={() => {
              modalStore.openMixinNotification();
            }}
          >
            <MdPhonelinkRing />
          </div>
        )}
      </div>
      <div
        className={classNames(
          {
            pc: isPc,
            'pc md': isPc && window.innerHeight > 700 + 100,
          },
          'md:px-8 notification-container overflow-y-auto',
        )}
      >
        {tabs[state.tabValue] !== ExtraNotificationType.TOPIC_REVIEW_REQUEST && (
          <div ref={infiniteRef}>
            {notificationStore.isFetched && <NotificationMessages />}
            {!notificationStore.isFetched && <div className="pt-20" />}
            {(!notificationStore.connected || notificationStore.loading) && (
              <div className="pt-10" style={{ height: '100px' }}>
                <Loading />
              </div>
            )}
          </div>
        )}
        {tabs[state.tabValue] === ExtraNotificationType.TOPIC_REVIEW_REQUEST && (
          <TopicReviewRequest />
        )}
      </div>
      <style jsx global>{`
        .notification-content .MuiTab-root {
          padding: 12px 12px;
          color: rgba(0, 0, 0, 0.54);
          font-size: 16px;
          line-height: 28px;
          min-width: auto;
          width: 16%;
          overflow: initial;
        }
        .notification-content .MuiTab-textColorInherit.Mui-selected {
          color: #63b3ed;
        }
        .notification-container {
          max-height: 85vh;
          overflow: auto;
        }
        .notification-container.pc {
          max-height: 80vh;
        }
        .notification-container.pc.md {
          max-height: 630px;
        }
        .notification-header {
          height: 50px;
        }
        .notification-filter-tabs.sm {
          min-height: auto;
        }
        .notification-filter-tabs.sm .MuiTab-root {
          font-size: 14px;
          min-height: auto;
          padding: 8px 12px;
        }
        .notification-filter-tabs.four-columns .MuiTab-root {
          width: 18%;
        }
        .notification-filter-tabs.sm .MuiTabs-indicator {
          transform: scaleX(0.5);
          bottom: 5px;
          height: 3px;
          border-radius: 2px;
        }
        .notification-filter-tabs .MuiTab-textColorInherit.Mui-selected {
          font-size: 15px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
});
