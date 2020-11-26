import { sleep, isMobile } from 'utils';

export function createSnackbarStore() {
  return {
    open: false,
    message: '',
    type: 'default',
    autoHideDuration: 2000,
    meta: {},
    show(options: any = {}) {
      (async () => {
        await sleep(options.delayDuration ? options.delayDuration : 150);
        this.close();
        const { message, duration = isMobile ? 1500 : 2000, type, meta = {} } = options;
        this.message = message;
        this.type = type || 'default';
        this.autoHideDuration = duration;
        this.open = true;
        this.meta = meta;
        await sleep(duration);
        this.close();
      })();
    },
    close() {
      this.open = false;
    },
  };
}
