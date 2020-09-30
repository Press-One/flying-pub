import { observer } from 'mobx-react-lite';
import io from 'socket.io-client';
import { useStore } from '../../store';
import { getMessageSystemUrl, getTokenUrl } from '../../utils';
import { NotificationSubType, Notification, NotificationStatus } from '../../store/notification';

let checkingTimer: any = 0;

const log = (event: string, data: any) => {
  if (typeof data === 'string') {
    console.log(`【Socket IO(notification) | ${event}】： ${data}`);
  } else {
    console.log(`【Socket IO(notification) | ${event}】`);
    console.log(data);
  }
};
const sleep = (duration: number) =>
  new Promise((resolve: any) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });

let socket: any = null;

export default observer(() => {
  const { userStore, notificationStore } = useStore();
  if (!userStore.isFetched || !userStore.isLogin) {
    return null;
  }

  const markAsRead = async (messages: Notification[]) => {
    const ids: number[] = messages
      .filter((m: Notification) => m.status !== NotificationStatus.READ)
      .map((message: Notification) => message.notification.id);
    if (ids.length === 0) return;
    await sleep(200);
    if (socket) {
      log('mark_as_read', ids);
      await socket.emit('mark_as_read', {
        notification_ids: ids,
      });
      await sleep(200);
      log('summary', 'refresh');
      await socket.emit('summary', { unread: true });
    }
  };

  socket = io(String(getMessageSystemUrl()));
  socket.on('connect', async () => {
    log('connect', '连接成功');
    const tokenRes = await fetch(getTokenUrl(), { credentials: 'include' });
    const token = await tokenRes.json();
    const tokenStr = Object.keys(token)
      .map((k: string) => `${k}=${token[k]}`)
      .join(';');
    const authData = {
      username: userStore.user.address,
      project: 'flyingpub_dev',
      third_party_cookie: tokenStr,
    };
    socket.emit('authenticate', authData);
  });

  socket.on('connect_error', () => {
    console.error('消息系统连接失败');
  });

  socket.on('private_message', async (data: any) => {
    log('private_message', '收到事件');
    if (data === 'welcome') {
      log('welcom', '鉴权成功');
      await sleep(2000);
      notificationStore.setConnected(true);
      socket.emit('summary', { unread: true });
      return;
    }
    try {
      const json = JSON.parse(data);
      console.log({ data: json });
      // trigger red point
      await socket.emit('summary', { unread: true });
    } catch (e) {
      console.log(data);
      console.error(e);
    }
  });

  socket.on('summary', (data: any) => {
    log('summary', '收到事件');
    try {
      const json = JSON.parse(data);
      let summary = {};
      for (const prop in json) {
        summary = Object.assign({}, summary, json[prop]);
      }
      console.log({ summary });
      notificationStore.setSummary(summary);
    } catch (e) {
      console.log(e);
    }
  });

  socket.on('history', async (data: any) => {
    log('history', '收到事件');
    try {
      clearTimeout(checkingTimer);
      await sleep(500);
      notificationStore.setLoading(false);
      notificationStore.setIsFetched(true);
      const json = JSON.parse(data);
      console.log({ data: json });
      notificationStore.setHasMore(json.length === notificationStore.limit);
      notificationStore.appendMessages(json);
      await markAsRead(json);
    } catch (e) {
      console.log(e);
    }
  });
  return null;
});

export const getNotificationSocket = () => socket;

export const getNotificationHistory = (
  subType: NotificationSubType,
  page: number,
  notificationStore: any,
) => {
  if (!socket) return;
  if (notificationStore.loading) return;
  notificationStore.setLoading(true);
  const payload = {
    sub_types: [subType],
    page,
    size: notificationStore.limit,
  };
  log('history', `请求 history: ${subType} page: ${page}`);
  socket.emit('history', payload);
  checkingTimer = setTimeout(() => {
    if (notificationStore.loading) {
      notificationStore.setMessages([]);
      notificationStore.setLoading(false);
    }
  }, 5000);
};
