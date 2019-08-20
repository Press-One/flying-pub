import Parser from 'rss-parser';

export default {
  fetchFeed(rssUrl: string) {
    const parser = new Parser();
    const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
    return parser.parseURL(CORS_PROXY + rssUrl);
  },
};
