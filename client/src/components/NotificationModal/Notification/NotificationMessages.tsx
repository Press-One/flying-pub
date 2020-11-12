import React from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import { useStore } from 'store';
import {
  NotificationSubType,
  NotificationType,
  Notification,
  CombinedNotificationType,
} from 'store/notification';
import { ago, removeUrlHost } from 'utils';
import marked from 'marked';
import ModalLink from 'components/ModalLink';
import Img from 'components/Img';

function formatDateTime(ts: string) {
  return ago(ts);
}

export default observer(() => {
  const { notificationStore, modalStore } = useStore();
  const subTypeToTitle: any = {
    [NotificationSubType.ARTICLE_COMMENT]: '评论了你的文章',
    [NotificationSubType.COMMENT_MENTION_ME]: '回复了你',
    [NotificationSubType.LIKE]: '赞了你的',
    [CombinedNotificationType.OTHERS]: '其他',
  };
  const typeToTitle: any = {
    [NotificationType.COMMENT]: '评论',
    [NotificationType.ARTICLE]: '文章',
  };
  const renderContent = (msg: Notification) => {
    const extras = msg.notification.extras;
    if (msg.notification.sub_type === NotificationSubType.COMMENT_MENTION_ME) {
      if (!msg.notification.extras.originUrl) {
        return <div className="text-12 text-gray-af border-l-4 pl-2">评论已经被 Ta 删除了</div>;
      }
      return (
        <div
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
        <div className="text-13 text-gray-4a">
          打赏了你的文章《
          <ModalLink
            to={removeUrlHost(extras.originUrl)}
            className="font-bold text-blue-400"
            onClick={() => {
              modalStore.closeNotification();
            }}
          >
            {extras.fromArticleTitle}
          </ModalLink>
          》 <span className="text-green-500 amount font-bold">{extras.amount}</span>{' '}
          <span className="text-xs text-gray-600 font-bold">{extras.currency || ''}</span>
        </div>
      );
    }

    if (
      msg.notification.type === NotificationType.ARTICLE &&
      msg.notification.sub_type === NotificationSubType.LIKE
    ) {
      return (
        <ModalLink
          to={removeUrlHost(extras.originUrl)}
          className="font-bold text-blue-400"
          onClick={() => {
            modalStore.closeNotification();
          }}
        >
          <span>{extras.fromArticleTitle}</span>
        </ModalLink>
      );
    }

    if (msg.notification.sub_type === NotificationSubType.AUTHOR_NEW_FOLLOWER) {
      return <div className="text-13 text-gray-4a">关注了你</div>;
    }

    if (msg.notification.sub_type === NotificationSubType.TOPIC_NEW_FOLLOWER) {
      return (
        <div className="text-13 text-gray-4a">
          关注了你的专题《
          <ModalLink
            to={`/topics/${extras.topicUuid}`}
            className="font-bold text-blue-400"
            onClick={() => {
              modalStore.closeNotification();
            }}
          >
            {extras.topicName}
          </ModalLink>
          》
        </div>
      );
    }

    if (msg.notification.sub_type === NotificationSubType.TOPIC_POST_BE_CONTRIBUTED) {
      return (
        <div className="text-13 text-gray-4a">
          把你的文章《
          <ModalLink
            to={`/posts/${extras.postRId}`}
            className="font-bold text-blue-400"
            onClick={() => {
              modalStore.closeNotification();
            }}
          >
            {extras.postTitle}
          </ModalLink>
          》收录到专题《
          <ModalLink
            to={`/topics/${extras.topicUuid}`}
            className="font-bold text-blue-400"
            onClick={() => {
              modalStore.closeNotification();
            }}
          >
            {extras.topicName}
          </ModalLink>
          》
        </div>
      );
    }

    if (msg.notification.sub_type === NotificationSubType.TOPIC_CONTRIBUTION_REQUEST_APPROVED) {
      return (
        <div className="text-13 text-gray-4a">
          你的文章已审核通过，文章《
          <ModalLink
            to={`/posts/${extras.postRId}`}
            className="font-bold text-blue-400"
            onClick={() => {
              modalStore.closeNotification();
            }}
          >
            {extras.postTitle}
          </ModalLink>
          》已经收录到专题《
          <ModalLink
            to={`/topics/${extras.topicUuid}`}
            className="font-bold text-blue-400"
            onClick={() => {
              modalStore.closeNotification();
            }}
          >
            {extras.topicName}
          </ModalLink>
          》
        </div>
      );
    }

    if (msg.notification.sub_type === NotificationSubType.TOPIC_RECEIVED_CONTRIBUTION) {
      return (
        <div className="text-13 text-gray-4a">
          把文章《
          <ModalLink
            to={`/posts/${extras.postRId}`}
            className="font-bold text-blue-400"
            onClick={() => {
              modalStore.closeNotification();
            }}
          >
            {extras.postTitle}
          </ModalLink>
          》投稿你的专题《
          <ModalLink
            to={`/topics/${extras.topicUuid}`}
            className="font-bold text-blue-400"
            onClick={() => {
              modalStore.closeNotification();
            }}
          >
            {extras.topicName}
          </ModalLink>
          》
        </div>
      );
    }

    if (msg.notification.sub_type === NotificationSubType.TOPIC_REJECTED_CONTRIBUTION) {
      return (
        <div>
          <div className="text-13 text-gray-4a">
            从专题《
            <ModalLink
              to={`/topics/${extras.topicUuid}`}
              className="font-bold text-blue-400"
              onClick={() => {
                modalStore.closeNotification();
              }}
            >
              {extras.topicName}
            </ModalLink>
            》 移除了你的文章《
            <ModalLink
              to={`/posts/${extras.postRId}`}
              className="font-bold text-blue-400"
              onClick={() => {
                modalStore.closeNotification();
              }}
            >
              {extras.postTitle}
            </ModalLink>
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

    if (msg.notification.sub_type === NotificationSubType.TOPIC_CONTRIBUTION_REQUEST_REJECTED) {
      return (
        <div>
          <div className="text-13 text-gray-4a">
            你的投稿请求被拒绝了。文章《
            <ModalLink
              to={`/posts/${extras.postRId}`}
              className="font-bold text-blue-400"
              onClick={() => {
                modalStore.closeNotification();
              }}
            >
              {extras.postTitle}
            </ModalLink>
            》无法投稿到专题《
            <ModalLink
              to={`/topics/${extras.topicUuid}`}
              className="font-bold text-blue-400"
              onClick={() => {
                modalStore.closeNotification();
              }}
            >
              {extras.topicName}
            </ModalLink>
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
      if (!msg.notification.extras.originUrl) {
        return <div className="text-12 text-gray-af border-l-4 pl-2">评论已经被 Ta 删除了</div>;
      }
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
              'px-4 md:px-3 flex mb-4 pb-4 pt-1',
            )}
          >
            <div className="msg-avatar">
              <ModalLink
                to={`/authors/${msg.notification.extras.fromUserName}`}
                className="font-bold text-blue-400"
                onClick={() => {
                  modalStore.closeNotification();
                }}
              >
                <Img
                  className="rounded-full"
                  src={msg.notification.extras.fromUserAvatar}
                  alt="avatar"
                  width="36"
                  height="36"
                />
              </ModalLink>
            </div>
            <div className="msg-body ml-3 flex-1">
              <div className="msg-title mb-2">
                <ModalLink
                  to={`/authors/${msg.notification.extras.fromUserName}`}
                  className="font-bold text-blue-400"
                  onClick={() => {
                    modalStore.closeNotification();
                  }}
                >
                  <span className="from-user-name">{msg.notification.extras.fromNickName}</span>
                </ModalLink>
                <span className="msg-head ml-2">
                  {subTypeToTitle[msg.notification.sub_type]}
                  {msg.notification.sub_type === NotificationSubType.LIKE
                    ? typeToTitle[msg.notification.type]
                    : ''}
                </span>
              </div>
              {renderContent(msg)}
              <div className="mt-2 pt-1 msg-foot flex items-center">
                <span className="msg-timestamp mr-5">
                  {formatDateTime(msg.notification.created_at)}
                </span>
                {msg.notification.type === NotificationType.COMMENT &&
                  msg.notification.sub_type === NotificationSubType.LIKE && (
                    <ModalLink
                      to={removeUrlHost(msg.notification.extras.originUrl)}
                      className="text-12 msg-link"
                      onClick={() => {
                        modalStore.closeNotification();
                      }}
                    >
                      去看看
                    </ModalLink>
                  )}
                {(msg.notification.sub_type === NotificationSubType.ARTICLE_COMMENT ||
                  msg.notification.sub_type === NotificationSubType.COMMENT_MENTION_ME) &&
                  msg.notification.extras.originUrl && (
                    <ModalLink
                      to={removeUrlHost(msg.notification.extras.originUrl)}
                      className="text-12 msg-link flex items-center"
                      onClick={() => {
                        modalStore.closeNotification();
                      }}
                    >
                      <span className="mr-1">去回复</span>
                    </ModalLink>
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
