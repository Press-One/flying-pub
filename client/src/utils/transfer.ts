import Api from 'api';
import { limitImageWidth } from 'utils';

export const transferResourceToCDN = (url: string) => {
  return new Promise(async (resolve) => {
    const res = await fetch(new Request(url));
    const blob: any = await res.blob();
    blob.lastModifiedDate = new Date();     
    blob.name = url.split('/').pop();     
    const newFile: any = await limitImageWidth(750, blob);
    const formData = new FormData();
    formData.append('file', newFile);
    formData.append('file_name', newFile.name);
    const newRes = await Api.uploadImage(formData);
    const newUrl = (await newRes.json()).url;
    resolve(newUrl);
  })
}
