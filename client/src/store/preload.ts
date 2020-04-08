export function createPreloadStore() {
  return {
    ready: false,
    done() {
      this.ready = true;
    },
  };
}
