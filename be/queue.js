const models = require('./models');
const queue = require('./models/queue');

models.cache.init();

queue.up();

process.stdin.resume();