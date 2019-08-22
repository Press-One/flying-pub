const config = require('./config');
const cors_proxy = require('cors-anywhere');

const {
  host,
  port
} = config;
cors_proxy.createServer({
  originWhitelist: [],
  requireHeader: ['origin', 'x-requested-with'],
  removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, function () {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
});