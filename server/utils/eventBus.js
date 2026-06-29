const EventEmitter = require('events');

const buildBus = new EventEmitter();

module.exports = { buildBus };

//step 1 in sse and then next hook thisup with buildservice