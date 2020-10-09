import { sleep } from 'utils';

interface File {
  title: string;
  url: string;
}

export function createPublishDialogStore() {
  const file: File = {
    title: '',
    url: '',
  };
  return {
    open: false,
    file,
    async show(file: File) {
      await sleep(1500);
      this.file = file;
      this.open = true;
    },
    hide() {
      this.open = false;
    },
  };
}
