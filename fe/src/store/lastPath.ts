export function createPathStore() {
  const paths: any = [];
  return {
    paths,
    get prevPath() {
      return this.paths[this.paths.length - 2] || '';
    },
    get lastPath() {
      return this.paths[this.paths.length - 1] || '';
    },
    pushPath(path: string) {
      if (this.lastPath !== path) {
        this.paths.push(path);
      }
    },
  };
}
