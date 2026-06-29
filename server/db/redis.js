const Redis = require('ioredis');

require('dotenv').config();

const redisConnection = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    maxRetriesPerRequest: null,
});

module.exports = { redisConnection };