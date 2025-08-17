const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { Follow, User } = require('../../models');
const redis = require('../../utils/redis');

const REDIS_TTL = 3600; // 1 hour

async function getUserCounts(userId) {
  const followersKey = `user:${userId}:followers_count`;
  const followingKey = `user:${userId}:following_count`;

  let [followers, following] = await Promise.all([
    redis.get(followersKey),
    redis.get(followingKey),
  ]);

  if (followers === null) {
    followers = await Follow.count({ where: { Following: userId } });
    await redis.set(followersKey, followers, 'EX', REDIS_TTL);
  } else {
    followers = parseInt(followers);
    if (isNaN(followers)) followers = 0;
  }

  if (following === null) {
    following = await Follow.count({ where: { Follower: userId } });
    await redis.set(followingKey, following, 'EX', REDIS_TTL);
  } else {
    following = parseInt(following);
    if (isNaN(following)) following = 0;
  }

  return { followers, following };
}

router.post('/follow', auth, async (req, res) => {
  const Me = req.user.id;
  const { FollowingId } = req.body;

  if (!Me) return res.status(400).json({ message: "Missing Your Userid 😣" });
  if (!FollowingId) return res.status(400).json({ message: "Following Userid is required 😐" });
  if (Me === FollowingId) return res.status(400).json({ message: "You can't Follow Yourself 😁" });

  try {
    const isFollow = await Follow.findOne({ where: { Follower: Me, Following: FollowingId } });
    if (isFollow) return res.status(409).json({ message: "Already Followed 🙂" });

    await Follow.create({ Follower: Me, Following: FollowingId });

    await redis.incr(`user:${Me}:following_count`);
    await redis.incr(`user:${FollowingId}:followers_count`);

    const { followers, following } = await getUserCounts(Me);
    const targetCounts = await getUserCounts(FollowingId);

    return res.status(201).json({
      message: "You Followed Them Successfully 🫡",
      your_following: following,
      their_followers: targetCounts.followers
    });
  } catch (err) {
    console.error('Follow Error:', err);
    return res.status(500).json({ message: "Server Error 🤬" });
  }
});

router.delete('/unfollow', auth, async (req, res) => {
  const Me = req.user.id;
  const { FollowingId } = req.body;

  if (!Me) return res.status(400).json({ message: "Missing Your UserId 😐" });
  if (!FollowingId) return res.status(400).json({ message: "Missing Followed UserId 😑" });

  try {
    const removed = await Follow.destroy({ where: { Follower: Me, Following: FollowingId } });
    if (!removed) return res.status(404).json({ message: "You didn’t follow this user 😉" });

    await redis.decr(`user:${Me}:following_count`);
    await redis.decr(`user:${FollowingId}:followers_count`);

    const { followers, following } = await getUserCounts(Me);
    const targetCounts = await getUserCounts(FollowingId);

    return res.status(200).json({
      message: "Unfollowed Successfully 😮",
      your_following: following,
      their_followers: targetCounts.followers
    });
  } catch (err) {
    console.error("Unfollow Error:", err);
    return res.status(500).json({ message: "Server Error 🥵" });
  }
});

router.get('/user/:id/followers', async (req, res) => {
  const userId = req.params.id;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const followers = await Follow.findAll({
      where: { Following: userId },
      include: [{
        model: User,
        as: 'FollowerUser',
        attributes: ['id', 'name', 'username', 'bio', 'profileImageUrl', 'isBadgeVerified', 'openChat', 'visibility', 'status']
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({ followers });
  } catch (err) {
    console.error('Get Followers Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/user/:id/following', async (req, res) => {
  const userId = req.params.id;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const following = await Follow.findAll({
      where: { Follower: userId },
      include: [{
        model: User,
        as: 'FollowingUser',
        attributes: ['id', 'name', 'username', 'bio', 'profileImageUrl', 'isBadgeVerified', 'openChat', 'visibility', 'status']
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({ following });
  } catch (err) {
    console.error('Get Following Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/count/:userId', auth, async (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  try {
    let [followersCount, followingCount] = await Promise.all([
      redis.get(`user:${userId}:followers_count`),
      redis.get(`user:${userId}:following_count`),
    ]);

    let followers = followersCount !== null ? parseInt(followersCount) : await Follow.count({ where: { Following: userId } });
    let following = followingCount !== null ? parseInt(followingCount) : await Follow.count({ where: { Follower: userId } });

    if (isNaN(followers)) followers = 0;
    if (isNaN(following)) following = 0;

    if (followersCount === null) await redis.set(`user:${userId}:followers_count`, followers, 'EX', REDIS_TTL);
    if (followingCount === null) await redis.set(`user:${userId}:following_count`, following, 'EX', REDIS_TTL);

    res.json({ followers, following });
  } catch (err) {
    console.error('Count Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;