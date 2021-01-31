import Api from 'api';
import { limitImageWidth } from 'utils';

export const transferResourceToCDN = (url: string, type: string = 'img') => {
  return new Promise(async (resolve) => {
    const res = await fetch(new Request(url));
    let blob: any = await res.blob();
    blob.lastModifiedDate = new Date();     
    blob.name = url.split('/').pop(); 
    if (type === 'img') {
      blob = await limitImageWidth(750, blob);
    }
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('file_name', blob.name);
    const newRes = await Api.uploadImage(formData);
    const newUrl = (await newRes.json()).url;
    resolve(newUrl);
  })
}
