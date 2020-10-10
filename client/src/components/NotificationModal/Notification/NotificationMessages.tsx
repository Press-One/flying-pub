import React from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import { useStore } from '../../../store';
import { NotificationSubType, NotificationType, Notification } from '../../../store/notification';
import { ago, isPc, isMobile } from '../../../utils';
import marked from 'marked';

const defaultAvatar = 'https://avatar.xue.cn/avatar/default.png';

function formatDateTime(ts: string) {
  return ago(ts);
}

export default observer(() => {
  const { notificationStore, modalStore } = useStore();
  const subTypeToTitle: any = {
    [NotificationSubType.ARTICLE_COMMENT]: '评论了你的文章',
    [NotificationSubType.COMMENT_MENTION_ME]: '在评论中@你',
    [NotificationSubType.LIKE]: '赞了你的',
    [NotificationSubType.ARTICLE_REWARD]: '打赏了你的文章',
  };
  const typeToTitle: any = {
    [NotificationType.COMMENT]: '评论',
    [NotificationType.ARTICLE]: '文章',
  };
  const renderContent = (msg: Notification) => {
    if (msg.notification.sub_type === NotificationSubType.COMMENT_MENTION_ME) {
      return (
        <p
          className="msg-at-me"
          dangerouslySetInnerHTML={{ __html: marked.parse(msg.notification.extras.fromContent) }}
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
            dangerouslySetInnerHTML={{ __html: marked.parse(msg.notification.extras.fromContent) }}
          />
        </div>
      );
    }

    if (msg.notification.sub_type === NotificationSubType.ARTICLE_REWARD) {
      return (
        <p className="msg-reward-me flex items-center">
          <a
            className="text-blue-400 font-bold msg-link"
            href={msg.notification.extras.originUrl}
            target={isMobile ? '_self' : '_blank'}
            onClick={() => {
              isMobile && modalStore.openPageLoading();
            }}
            rel="noopener noreferrer"
          >
            {msg.notification.extras.fromArticleTitle}
            <span className="text-green-500 amount ml-2 font-bold">
              {msg.notification.extras.amount}
            </span>
            <span className="ml-1 text-xs text-gray-600 font-bold">
              {msg.notification.extras.currency || ''}
            </span>
          </a>
        </p>
      );
    }

    if (
      msg.notification.type === NotificationType.ARTICLE &&
      msg.notification.sub_type === NotificationSubType.LIKE
    ) {
      return (
        <a
          className="text-blue-400 font-bold msg-link"
          href={msg.notification.extras.originUrl}
          target={isMobile ? '_self' : '_blank'}
          onClick={() => {
            isMobile && modalStore.openPageLoading();
          }}
          rel="noopener noreferrer"
        >
          {msg.notification.extras.fromArticleTitle}
        </a>
      );
    }

    if (msg.notification.sub_type === NotificationSubType.ARTICLE_COMMENT) {
      return (
        <div
          className="msg-comment-me"
          dangerouslySetInnerHTML={{ __html: marked.parse(msg.notification.extras.fromContent) }}
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
              className="w-full text-13 mt-2 mb-8 text-center py-2 text-xs"
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
              {isMobile && (
                <Link
                  to={`/authors/${msg.notification.extras.fromUserName}`}
                  onClick={() => {
                    modalStore.closeNotification();
                  }}
                >
                  <img
                    className="rounded-full"
                    src={msg.notification.extras.fromUserAvatar || defaultAvatar}
                    alt="avatar"
                    width="36"
                    height="36"
                  />
                </Link>
              )}
              {isPc && (
                <a
                  href={`/authors/${msg.notification.extras.fromUserName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    className="rounded-full"
                    src={msg.notification.extras.fromUserAvatar || defaultAvatar}
                    alt="avatar"
                    width="36"
                    height="36"
                  />
                </a>
              )}
            </div>
            <div className="msg-body mx-3 flex-1">
              <p className="msg-title mb-2">
                {isMobile && (
                  <Link
                    to={`/authors/${msg.notification.extras.fromUserName}`}
                    onClick={() => {
                      modalStore.closeNotification();
                    }}
                  >
                    <span className="from-user-name">{msg.notification.extras.fromNickName}</span>
                  </Link>
                )}
                {isPc && (
                  <a
                    href={`/authors/${msg.notification.extras.fromUserName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="from-user-name">{msg.notification.extras.fromNickName}</span>
                  </a>
                )}
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
                {(msg.notification.sub_type === NotificationSubType.ARTICLE_COMMENT ||
                  msg.notification.sub_type === NotificationSubType.COMMENT_MENTION_ME) && (
                  <a
                    className="msg-link"
                    href={msg.notification.extras.originUrl}
                    target={isMobile ? '_self' : '_blank'}
                    onClick={() => {
                      isMobile && modalStore.openPageLoading();
                    }}
                    rel="noopener noreferrer"
                  >
                    去回复
                  </a>
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