const redis = require('../utils/redis');

module.exports = async (req, res, next) => {
  if (req.user && req.user.id) {
    const userId = req.user.id;
    const now = Date.now();
    await redis.set(`user:lastActive:${userId}`, now);
  }
  next();
};
