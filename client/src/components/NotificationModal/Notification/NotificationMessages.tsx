import React from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import { useStore } from '../../../store';
import {
  NotificationSubType,
  NotificationType,
  Notification,
  CombinedNotificationType,
} from '../../../store/notification';
import { ago, isMobile, removeUrlHost } from '../../../utils';
import marked from 'marked';
import OpenInNewLinkForPc from 'components/openInNewLinkForPc';
import { resizeImage } from 'utils';

const defaultAvatar = resizeImage('https://avatar.xue.cn/avatar/default.png');

function formatDateTime(ts: string) {
  return ago(ts);
}

export default observer(() => {
  const { notificationStore, modalStore } = useStore();
  const subTypeToTitle: any = {
    [NotificationSubType.ARTICLE_COMMENT]: '评论了你的文章',
    [NotificationSubType.COMMENT_MENTION_ME]: '回复了你',
    [NotificationSubType.LIKE]: '赞了你的',
    [NotificationSubType.AUTHOR_NEW_FOLLOWER]: '关注了你',
    [NotificationSubType.ARTICLE_REWARD]: '打赏了你的文章',
    [CombinedNotificationType.OTHERS]: '其他',
  };
  const typeToTitle: any = {
    [NotificationType.COMMENT]: '评论',
    [NotificationType.ARTICLE]: '文章',
  };
  const renderContent = (msg: Notification) => {
    const extras = msg.notification.extras;
    if (msg.notification.sub_type === NotificationSubType.COMMENT_MENTION_ME) {
      return (
        <p
          className="msg-at-me"
          dangerouslySetInnerHTML={{ __html: marked.parse(extras.fromContent) }}
        />
      );
    }

    if (
      msg.notification.type === NotificationType.COMMENT &&
      msg.notification.sub_type === NotificationSubType.LIKE
    ) {
      return (
        <div className="msg-like-comment">
          <div
            className="mt-1 pl-2 border-l-2 markdown-body"
            dangerouslySetInnerHTML={{ __html: marked.parse(extras.fromContent) }}
          />
        </div>
      );
    }

    if (msg.notification.sub_type === NotificationSubType.ARTICLE_REWARD) {
      return (
        <p className="msg-reward-me flex items-center">
          <OpenInNewLinkForPc
            to={removeUrlHost(extras.originUrl)}
            className="font-bold text-blue-400"
            onClick={() => {
              modalStore.closeNotification();
            }}
          >
            <span>
              {extras.fromArticleTitle}
              <span className="text-green-500 amount ml-2 font-bold">{extras.amount}</span>
              <span className="ml-1 text-xs text-gray-600 font-bold">{extras.currency || ''}</span>
            </span>
          </OpenInNewLinkForPc>
        </p>
      );
    }

    if (
      msg.notification.type === NotificationType.ARTICLE &&
      msg.notification.sub_type === NotificationSubType.LIKE
    ) {
      return (
        <OpenInNewLinkForPc
          to={removeUrlHost(extras.originUrl)}
          className="font-bold text-blue-400"
          onClick={() => {
            modalStore.closeNotification();
          }}
        >
          <span>{extras.fromArticleTitle}</span>
        </OpenInNewLinkForPc>
      );
    }

    if (msg.notification.sub_type === NotificationSubType.AUTHOR_NEW_FOLLOWER) {
      return (
        <OpenInNewLinkForPc
          to={`/authors/${extras.fromUserName}`}
          className="font-bold text-blue-400 text-13"
          onClick={() => {
            modalStore.closeNotification();
          }}
        >
          去 Ta 的主页看看
        </OpenInNewLinkForPc>
      );
    }

    if (msg.notification.sub_type === NotificationSubType.TOPIC_RECEIVED_CONTRIBUTION) {
      return (
        <div className="text-13">
          向你的专题《
          <OpenInNewLinkForPc
            to={`/topics/${extras.topicUuid}`}
            className="font-bold text-blue-400"
            onClick={() => {
              modalStore.closeNotification();
            }}
          >
            {extras.topicName}
          </OpenInNewLinkForPc>
          》投稿文章《
          <OpenInNewLinkForPc
            to={`/posts/${extras.postRId}`}
            className="font-bold text-blue-400"
            onClick={() => {
              modalStore.closeNotification();
            }}
          >
            {extras.postTitle}
          </OpenInNewLinkForPc>
          》
        </div>
      );
    }

    if (msg.notification.sub_type === NotificationSubType.TOPIC_REJECTED_CONTRIBUTION) {
      return (
        <div>
          <div className="text-13">
            从专题《
            <OpenInNewLinkForPc
              to={`/topics/${extras.topicUuid}`}
              className="font-bold text-blue-400"
              onClick={() => {
                modalStore.closeNotification();
              }}
            >
              {extras.topicName}
            </OpenInNewLinkForPc>
            》 移除了你的文章《
            <OpenInNewLinkForPc
              to={`/posts/${extras.postRId}`}
              className="font-bold text-blue-400"
              onClick={() => {
                modalStore.closeNotification();
              }}
            >
              {extras.postTitle}
            </OpenInNewLinkForPc>
            》
          </div>
          {extras.note && (
            <div>
              <div className="mt-2 text-gray-99 text-12">原因是：</div>
              <div
                className="msg-topic-rejected-note mt-2 pl-2 border-l-2 markdown-body text-12"
                dangerouslySetInnerHTML={{ __html: marked.parse(extras.note) }}
              />
            </div>
          )}
        </div>
      );
    }

    if (msg.notification.sub_type === NotificationSubType.ARTICLE_COMMENT) {
      return (
        <div
          className="msg-comment-me"
          dangerouslySetInnerHTML={{ __html: marked.parse(extras.fromContent) }}
        />
      );
    }
  };

  const length = notificationStore.messages.length;
  return (
    <section className="m-auto pb-2 pt-5 md:pt-8">
      {notificationStore.messages.map((msg: Notification, idx: number) => {
        const ret = [];
        const nextMsg = notificationStore.messages[idx + 1];
        if (notificationStore.lastReadMsgId === msg.id && idx > 0) {
          ret.push(
            <div
              key="msg-last-read"
              className="w-full text-12 mt-2 mb-8 text-center py-2"
              style={{ background: '#F7F9FC', color: '#afafaf' }}
            >
              上次看到这里
            </div>,
          );
        }
        ret.push(
          <div
            key={'msg' + idx}
            className={classNames(
              {
                'border-gray-300 border-b':
                  nextMsg && notificationStore.lastReadMsgId !== nextMsg.id,
              },
              'flex mb-4 pb-4 pt-1',
            )}
          >
            <div className="msg-avatar">
              <OpenInNewLinkForPc
                to={`/authors/${msg.notification.extras.fromUserName}`}
                className="font-bold text-blue-400"
                onClick={() => {
                  modalStore.closeNotification();
                }}
              >
                <img
                  className="rounded-full"
                  src={resizeImage(msg.notification.extras.fromUserAvatar) || defaultAvatar}
                  alt="avatar"
                  width="36"
                  height="36"
                />
              </OpenInNewLinkForPc>
            </div>
            <div className="msg-body mx-3 flex-1">
              <p className="msg-title mb-2">
                <OpenInNewLinkForPc
                  to={`/authors/${msg.notification.extras.fromUserName}`}
                  className="font-bold text-blue-400"
                  onClick={() => {
                    modalStore.closeNotification();
                  }}
                >
                  <span className="from-user-name">{msg.notification.extras.fromNickName}</span>
                </OpenInNewLinkForPc>
                <span className="msg-head ml-2">
                  {subTypeToTitle[msg.notification.sub_type]}
                  {msg.notification.sub_type === NotificationSubType.LIKE
                    ? typeToTitle[msg.notification.type]
                    : ''}
                </span>
              </p>
              {renderContent(msg)}
              <div className="mt-2 pt-1 msg-foot">
                <span className="msg-timestamp mr-5">
                  {formatDateTime(msg.notification.created_at)}
                </span>
                {msg.notification.type === NotificationType.COMMENT &&
                  msg.notification.sub_type === NotificationSubType.LIKE && (
                    <OpenInNewLinkForPc
                      to={removeUrlHost(msg.notification.extras.originUrl)}
                      className="text-12 msg-link"
                      onClick={() => {
                        isMobile && modalStore.closeNotification();
                      }}
                    >
                      去看看
                    </OpenInNewLinkForPc>
                  )}
                {(msg.notification.sub_type === NotificationSubType.ARTICLE_COMMENT ||
                  msg.notification.sub_type === NotificationSubType.COMMENT_MENTION_ME) && (
                  <OpenInNewLinkForPc
                    to={removeUrlHost(msg.notification.extras.originUrl)}
                    className="text-12 msg-link"
                    onClick={() => {
                      isMobile && modalStore.closeNotification();
                    }}
                  >
                    去回复
                  </OpenInNewLinkForPc>
                )}
              </div>
            </div>
          </div>,
        );
        return ret;
      })}
      {notificationStore.isFetched && !notificationStore.loading && length === 0 && (
        <div className="pt-20 text-center text-gray-500 font-medium">还没有收到消息呢</div>
      )}
    </section>
  );
});
