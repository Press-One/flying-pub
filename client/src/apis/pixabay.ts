import qs from 'query-string';

export default {
  async search(options: any = {}) {
    const url = `https://pixabay.com/api?key=13927481-1de5dcccace42d9447c90346f&safesearch=true&image_type=photo&${qs.stringify(options)}`;
    return await (await fetch(url)).json()
  },
}