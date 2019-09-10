import Parser from 'rss-parser';

export default {
  fetchFeed(rssUrl: string) {
    const parser = new Parser();
    return parser.parseURL(rssUrl);
  },
};
