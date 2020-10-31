import { sleep } from 'utils';
import { IFile } from 'apis/file';

export function createPublishDialogStore() {
  return {
    open: false,
    file: {} as IFile,
    async show(file: IFile) {
      await sleep(1000);
      this.file = file;
      this.open = true;
    },
    hide() {
      this.open = false;
    },
  };
}
