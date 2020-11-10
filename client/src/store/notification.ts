export enum NotificationType {
  ARTICLE = 'ARTICLE',
  COMMENT = 'COMMENT',
}

export enum CombinedNotificationType {
  OTHERS = 'OTHERS',
}

export enum ExtraNotificationType {
  TOPIC_REVIEW_REQUEST = 'TOPIC_REVIEW_REQUEST'
}

export enum NotificationSubType {
  // @ 、回复、点赞、打赏
  COMMENT_MENTION_ME = 'COMMENT_MENTION_ME',
  LIKE = 'LIKE',
  ARTICLE_COMMENT = 'ARTICLE_COMMENT',
  ARTICLE_REWARD = 'ARTICLE_REWARD',
  AUTHOR_NEW_FOLLOWER = 'AUTHOR_NEW_FOLLOWER',
  TOPIC_NEW_FOLLOWER = 'TOPIC_NEW_FOLLOWER',
  TOPIC_POST_BE_CONTRIBUTED = 'TOPIC_POST_BE_CONTRIBUTED',
  TOPIC_REJECTED_CONTRIBUTION = 'TOPIC_REJECTED_CONTRIBUTION',
  TOPIC_RECEIVED_CONTRIBUTION = 'TOPIC_RECEIVED_CONTRIBUTION',
  OTHERS = 'OTHERS'
}

export enum NotificationStatus {
  READ = 'READ',
  SENT = 'SENT',
  PEND = 'PEND',
}

interface NotificationExtra {
  fromNickName: string;
  fromUserAvatar: string;
  originUrl: string;
  [x: string]: any;
}

export interface NotificationBody {
  id: number;
  content: string;
  created_at: string;
  sender: string;
  sub_type: NotificationSubType;
  title: string;
  type: NotificationType;
  extras: NotificationExtra;
}

export interface Notification {
  id: number;
  status: NotificationStatus;
  notification: NotificationBody;
}

export function createNotificationStore() {
  return {
    lastReadMsgId: 0,
    connected: false,
    limit: 15,
    loading: false,
    messages: [] as Notification[],
    summary: {} as any,
    isFetched: false,
    hasMore: false,
    subTypes: [NotificationSubType.LIKE] as NotificationSubType[],
    othersSubTypes: [
      NotificationSubType.ARTICLE_REWARD,
      NotificationSubType.AUTHOR_NEW_FOLLOWER,
      NotificationSubType.TOPIC_NEW_FOLLOWER,
      NotificationSubType.TOPIC_POST_BE_CONTRIBUTED,
      NotificationSubType.TOPIC_RECEIVED_CONTRIBUTION,
      NotificationSubType.TOPIC_REJECTED_CONTRIBUTION,
    ],
    setConnected(connected: boolean) {
      this.connected = connected;
    },
    setIsFetched(isFetched: boolean) {
      this.isFetched = isFetched;
    },
    setMessages(messages: Notification[]) {
      const orderedMessages = messages.slice().sort((a: Notification, b: Notification) => {
        return b.id - a.id;
      });
      this.messages = orderedMessages;
    },
    appendMessages(messages: Notification[], snackbarStore: any = null) {
      const hasIds = this.messages.map((m: Notification) => m.notification.id);
      messages.forEach((m: Notification, idx: number) => {
        if (!this.subTypes.includes(m.notification.sub_type)) {
          return;
        }
        if (m.status === 'READ' && this.lastReadMsgId === 0) {
          this.lastReadMsgId = m.id;
        }
        if (!hasIds.includes(m.notification.id)) {
          this.messages.push(m);
          if (snackbarStore) {
            setTimeout(() => {
              snackbarStore.show({
                message: m.notification.content + m.notification.id,
                key: m.notification.id,
                type: 'notify',
              });
            }, idx * 750);
          }
        }
      });
      this.setMessages(this.messages);
    },
    setSummary(summary: any) {
      this.summary = summary;
    },
    setLoading(loading: boolean) {
      this.loading = loading;
    },
    setHasMore(hasMore: boolean) {
      this.hasMore = hasMore;
    },
    setSubTypes(subTypes: NotificationSubType[]) {
      this.subTypes = subTypes;
      // clean messages when tab switched
      this.messages = [];
      this.lastReadMsgId = 0;
    },
    getUnread() {
      return Object.values(this.summary).reduce((a: any, b: any) => a + b, 0) as number;
    },
    reset() {
      this.messages = [];
      this.subTypes = [NotificationSubType.LIKE];
      this.isFetched = false;
    },
  };
}
