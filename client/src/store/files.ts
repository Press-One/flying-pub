export function createFilesStore() {
  return {
    isFetching: false,
    total: 0,
    files: [] as Array<any>,
    setIsFetching(status: boolean) {
      this.isFetching = status;
    },
    setTotal(total: number) {
      this.total = total;
    },
    setFiles(files: any) {
      this.files = files;
    },
    updateFile(file: any) {
      this.files = this.files.map((item) => {
        if (+item.id === +file.id) {
          return file;
        }
        return item;
      });
    },
    updateFileByIdx(file: any, idx: number) {
      this.files[idx] = file;
    },
  };
}
