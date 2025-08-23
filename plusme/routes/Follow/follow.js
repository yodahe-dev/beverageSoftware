const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { Follow, User } = require('../../models');
const { Op } = require('sequelize');

// Helper function to get real-time counts
async function getUserCounts(userId) {
  const followers = await Follow.count({ where: { Following: userId } });
  const following = await Follow.count({ where: { Follower: userId } });
  return { followers, following };
}

// Follow a user
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

// Unfollow a user
router.delete('/unfollow', auth, async (req, res) => {
  const Me = req.user.id;
  const { FollowingId } = req.body;

  if (!Me) return res.status(400).json({ message: "Missing Your UserId 😐" });
  if (!FollowingId) return res.status(400).json({ message: "Missing Followed UserId 😑" });

  try {
    const removed = await Follow.destroy({ where: { Follower: Me, Following: FollowingId } });
    if (!removed) return res.status(404).json({ message: "You didn’t follow this user 😉" });

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

// Get followers of a user
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

// Get following of a user
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

// Get user counts (followers & following) in real-time
router.get('/count/:userId', auth, async (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  try {
    const { followers, following } = await getUserCounts(userId);
    res.json({ followers, following });
  } catch (err) {
    console.error('Count Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/Allusers', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50; // default 50
    const offset = parseInt(req.query.offset) || 0;

    const users = await User.findAll({
      attributes: [
        'id', 'name', 'username', 'email', 'bio', 'profileImageUrl',
        'isBadgeVerified', 'openChat', 'visibility', 'status', 'createdAt'
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({ users });
  } catch (err) {
    console.error('Get All Users Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get users not followed by the current user
router.get('/NotFollowingUsers', auth, async (req, res) => {
  const Me = req.user.id;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  try {
    // Find all users I already follow
    const following = await Follow.findAll({
      where: { Follower: Me },
      attributes: ['Following']
    });

    const followingIds = following.map(f => f.Following);

    // Get users excluding myself & the ones I follow
    const users = await User.findAll({
      where: {
        id: {
          [Op.notIn]: [Me, ...followingIds]
        }
      },
      attributes: [
        'id', 'name', 'username', 'bio', 'profileImageUrl',
        'isBadgeVerified', 'openChat', 'visibility', 'status', 'createdAt'
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({ users });
  } catch (err) {
    console.error('Get Not-Following Users Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
