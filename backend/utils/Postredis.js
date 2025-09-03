const Redis = require('ioredis');
// default for caching, sessions, etc.
const cacheRedis = new Redis({ db: 0 });

// dedicated for search/recommendations
const searchRedis = new Redis({ db: 1 });

module.exports = { cacheRedis, searchRedis };
