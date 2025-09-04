const redis = require('./redis');

const ONLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

async function getUserStatus(userId) {
  const lastActive = await redis.get(`user:lastActive:${userId}`);
  
  if (!lastActive) return { online: false, lastActive: null };

  const lastActiveTime = Number(lastActive);
  const online = !isNaN(lastActiveTime) && Date.now() - lastActiveTime <= ONLINE_THRESHOLD;

  return { online, lastActive: new Date(lastActiveTime) };
}

module.exports = { getUserStatus };
