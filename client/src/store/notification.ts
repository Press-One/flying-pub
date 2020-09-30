export enum NotificationType {
  ARTICLE = 'ARTICLE',
  COMMENT = 'COMMENT',
}

export enum NotificationSubType {
  // @ 、回复、点赞、打赏
  COMMENT_MENTION_ME = 'COMMENT_MENTION_ME',
  LIKE = 'LIKE',
  ARTICLE_COMMENT = 'ARTICLE_COMMENT',
  ARTICLE_REWARD = 'ARTICLE_REWARD',
}

export enum NotificationStatus {
  READ = 'READ',
  SENT = 'SENT',
  PEND = 'PEND',
}
interface NotificationSummary {
  [NotificationSubType.COMMENT_MENTION_ME]?: number;
  [NotificationSubType.LIKE]?: number;
  [NotificationSubType.ARTICLE_COMMENT]?: number;
  [NotificationSubType.ARTICLE_REWARD]?: number;
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
    summary: {} as NotificationSummary,
    isFetched: false,
    hasMore: false,
    subType: NotificationSubType.LIKE,
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
        if (m.notification.sub_type !== this.subType) {
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
    setSummary(summary: NotificationSummary) {
      this.summary = summary;
    },
    setLoading(loading: boolean) {
      this.loading = loading;
    },
    setHasMore(hasMore: boolean) {
      this.hasMore = hasMore;
    },
    setSubType(subType: NotificationSubType) {
      this.subType = subType;
      // clean messages when tab switched
      this.messages = [];
      this.lastReadMsgId = 0;
    },
    getUnread() {
      return Object.values(this.summary).reduce((a, b) => a + b, 0);
    },
    reset() {
      this.messages = [];
      this.subType = NotificationSubType.LIKE;
      this.isFetched = false;
    },
  };
}
