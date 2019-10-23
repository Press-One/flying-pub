const app = require('./app');
const config = require('./config');
const http = require('http');
const queue = require('./models/queue');

const server = http.createServer(app.callback());
server.listen(config.queuePort, () => {
  app.serverUpCallback(server);
  if (config.sync) {
    queue.up();
  }
});