import Parser from 'rss-parser';

export default {
  fetchFeed(rssUrl: string) {
    const parser = new Parser();
    const { REACT_APP_CORS_PROXY } = process.env;
    return parser.parseURL(REACT_APP_CORS_PROXY + rssUrl);
  },
};
