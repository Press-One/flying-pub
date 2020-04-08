export function createSnackbarStore() {
  return {
    open: false,
    message: '',
    type: 'default',
    autoHideDuration: 2000,
    meta: {},
    show(options: any = {}) {
      const { message, duration = 2000, type, meta = {} } = options;
      this.message = message;
      this.type = type || this.type;
      this.autoHideDuration = duration;
      this.open = true;
      this.meta = meta;
    },
    close() {
      this.open = false;
      this.message = '';
      this.type = 'default';
    },
  };
}
