const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { Like, Post, User, sequelize } = require('../../models');
const redis = require('../../utils/redis'); // expects exported redis client with get, incr, decr, set

// helper for redis key
function likeKey(postId) {
  return `post:${postId}:likes`;
}

// Toggle like/unlike
router.post('/:postId/like', auth, async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  try {
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    let result; // store response to send after transaction

    // transactionally toggle
    await sequelize.transaction(async (tx) => {
      const existingLike = await Like.findOne({
        where: { userId, postId },
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });

      if (existingLike) {
        await existingLike.destroy({ transaction: tx });
        // decrement redis count (guard against negative)
        try {
          const key = likeKey(postId);
          const current = await redis.get(key);
          if (current !== null) {
            if (parseInt(current, 10) > 0) {
              await redis.decr(key);
            }
          } else {
            const count = await Like.count({ where: { postId } });
            await redis.set(key, count, 'EX', 3600); // 1h cache
          }
        } catch (e) {
          console.warn('Redis update on unlike failed', e);
        }
        result = { message: "Post unliked", liked: false };
      } else {
        await Like.create({ userId, postId }, { transaction: tx });
        // increment redis
        try {
          const key = likeKey(postId);
          const current = await redis.get(key);
          if (current !== null) {
            await redis.incr(key);
          } else {
            const count = await Like.count({ where: { postId } });
            await redis.set(key, count, 'EX', 3600); // 1h cache
          }
        } catch (e) {
          console.warn('Redis update on like failed', e);
        }
        result = { message: "Post liked", liked: true };
      }
    });

    return res.json(result);
  } catch (err) {
    console.error("Like/unlike error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get like count for a post (cached)
router.get('/:postId/likes/count', async (req, res) => {
  const { postId } = req.params;

  try {
    const key = likeKey(postId);
    let likes;

    const cached = await redis.get(key);
    if (cached !== null) {
      likes = parseInt(cached, 10);
    } else {
      likes = await Like.count({ where: { postId } });
      await redis.set(key, likes, 'EX', 3600); // 1h cache
    }

    return res.json({ postId, likes });
  } catch (err) {
    console.error("Get like count error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get list of users who liked a post (with pagination)
router.get('/:postId/likes/users', async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  try {
    const likes = await Like.findAll({
      where: { postId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'username', 'profileImageUrl']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      limit: parseInt(limit, 10),
    });

    return res.json({
      postId,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      users: likes.map(like => like.user)
    });
  } catch (err) {
    console.error("Get users who liked post error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get all liked posts by current user
router.get('/my/likes', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const likes = await Like.findAll({
      where: { userId },
      include: [{ model: Post, as: 'post' }]
    });
    return res.json({ data: likes });
  } catch (err) {
    console.error("Get liked posts error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
