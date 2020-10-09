export function createSnackbarStore() {
  return {
    open: false,
    message: '',
    type: 'default',
    autoHideDuration: 2000,
    meta: {},
    show(options: any = {}) {
      this.close();
      setTimeout(() => {
        const { message, duration = 2000, type, meta = {} } = options;
        this.message = message;
        this.type = type || 'default';
        this.autoHideDuration = duration;
        this.open = true;
        this.meta = meta;
      }, 100);
    },
    close() {
      this.open = false;
    },
  };
}
