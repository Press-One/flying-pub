import { observer } from 'mobx-react-lite';
import io from 'socket.io-client';
import { useStore } from '../../store';
import { getTokenUrl } from '../../utils';
import { Notification, NotificationStatus } from '../../store/notification';

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
  const { settingsStore, userStore, notificationStore } = useStore();
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

  socket = io(String(settingsStore.settings.extra['messageSystem.endpoint']));
  socket.on('connect', async () => {
    log('connect', '连接成功');
    const tokenRes = await fetch(getTokenUrl(), { credentials: 'include' });
    console.log(` ------------- hard code ---------------`);
    const token = await tokenRes.json();
    // const token: any = {
    //   FLYING_PUB_DEV_TOKEN_V2:
    //     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MDE0NjMzNTIsImp0aSI6IjgyNGVjNjE5LTZjOTMtNDhkMy1iMzZhLWYwNDFhMDQ0YTk1ZiIsImRhdGEiOnsidXNlcklkIjoiMSIsInByb3ZpZGVySWQiOiIzOTIwMjIxMCIsInByb2ZpbGVSYXciOiJ7XCJ1c2VyX2lkXCI6XCI1ZTZiMDI4Yi0zYjZkLTRlNTctYTQ4ZC05NzZmOTBiOWQyZmJcIixcImZ1bGxfbmFtZVwiOlwi5rSX5Ymq5ZC555S16K-dXCIsXCJpZGVudGl0eV9udW1iZXJcIjpcIjM5MjAyMjEwXCIsXCJiaW9ncmFwaHlcIjpcIlwiLFwiYXZhdGFyX3VybFwiOlwiXCIsXCJzZXNzaW9uX2lkXCI6XCI2ZWEyNTJlNC03ODY3LTRhMDItOWJmNC1mYjYyNTczNGM2YzJcIixcImNvZGVfaWRcIjpcIjI3YjU1NjkxLTJlNmEtNDYxZC04ZWU2LTVhMDlkMGM2ZTVhMFwifSIsInByb3ZpZGVyIjoibWl4aW4ifSwiZXhwIjoxNjMyOTk5MzUyfQ.3l2DRuD7tSNVBdlSl2H1puzlagjSpVKvm7CLC1V3ne4',
    // };
    const tokenStr = Object.keys(token)
      .map((k: string) => `${k}=${token[k]}`)
      .join(';');
    const authData = {
      username: userStore.user.address,
      project: settingsStore.settings.extra['messageSystem.project'],
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

export const getNotificationHistory = (subTypes: any[], page: number, notificationStore: any) => {
  if (!socket) return;
  if (notificationStore.loading) return;
  notificationStore.setLoading(true);
  const payload = {
    sub_types: subTypes,
    page,
    size: notificationStore.limit,
  };
  log('history', `请求 history: ${subTypes} page: ${page}`);
  socket.emit('history', payload);
  checkingTimer = setTimeout(() => {
    if (notificationStore.loading) {
      notificationStore.setMessages([]);
      notificationStore.setLoading(false);
    }
  }, 5000);
};
