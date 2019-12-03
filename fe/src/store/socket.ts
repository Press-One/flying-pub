import io from 'socket.io-client';
import { getApiEndpoint } from 'utils';

const log = (event: string, data: any) => {
  if (typeof data === 'string') {
    console.log(`【Socket IO | ${event}】： ${data}`);
  } else {
    console.log(`【Socket IO | ${event}】`);
    console.log(data);
  }
};

export function createSocketStore() {
  let socket: any;
  return {
    socket,
    get isReady() {
      return !!this.socket;
    },
    init(identity: number) {
      const socket = io(String(getApiEndpoint()));
      socket.on('connect', () => {
        log('connect', '连接成功');
        socket.emit('authenticate', identity);
      });
      socket.on('authenticate', (data: any) => {
        log('authenticate', data);
      });
      socket.on('connect_error', () => {
        console.error('Socket 连接失败, 请检查后端服务是否已启动？');
      });
      this.socket = socket;
    },
    on(event: string, callback: any) {
      if (this.socket) {
        this.socket.on(event, (data: any) => {
          log(event, data);
          callback(data);
        });
      }
    },
    off(event: string) {
      this.socket && this.socket.removeListener(event);
    },
  };
}
