const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { SavedPost, Post, User, sequelize } = require('../../models');
const redis = require('../../utils/redis');

function saveKey(postId) {
  return `post:${postId}:saves`;
}

router.post('/:postId/save', auth, async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  try {
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    await sequelize.transaction(async (tx) => {
      const existingSave = await SavedPost.findOne({
        where: { userId, postId },
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });

      if (existingSave) {
        await existingSave.destroy({ transaction: tx });
        try {
          const key = saveKey(postId);
          const current = await redis.get(key);
          if (current !== null) {
            if (parseInt(current, 10) > 0) {
              await redis.decr(key);
            }
          } else {
            const count = await SavedPost.count({ where: { postId } });
            await redis.set(key, count);
          }
        } catch (e) {
          console.warn('Redis update on unsave failed', e);
        }
        res.json({ message: "Post unsaved", saved: false });
      } else {
        await SavedPost.create({ userId, postId }, { transaction: tx });
        try {
          const key = saveKey(postId);
          const current = await redis.get(key);
          if (current !== null) {
            await redis.incr(key);
          } else {
            const count = await SavedPost.count({ where: { postId } });
            await redis.set(key, count);
          }
        } catch (e) {
          console.warn('Redis update on save failed', e);
        }
        res.json({ message: "Post saved", saved: true });
      }
    });
  } catch (err) {
    console.error("Save/unsave error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get('/my/saved', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const savedPosts = await SavedPost.findAll({
      where: { userId },
      include: [
        {
          model: Post,
          as: 'post',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'name', 'username', 'profileImageUrl']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      data: savedPosts.map(sp => ({
        id: sp.post.id,
        title: sp.post.title,
        contentJson: sp.post.contentJson,
        imageUrl: sp.post.imageUrl,
        author: sp.post.author,
        savedAt: sp.createdAt
      }))
    });
  } catch (err) {
    console.error("Get saved posts error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get('/:postId/saved', auth, async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  try {
    const isSaved = await SavedPost.findOne({ where: { userId, postId } });
    return res.json({ saved: !!isSaved });
  } catch (err) {
    console.error("Check saved error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get('/:postId/saves/count', async (req, res) => {
  const { postId } = req.params;

  try {
    const key = saveKey(postId);
    let saves;

    const cached = await redis.get(key);
    if (cached !== null) {
      saves = parseInt(cached, 10);
    } else {
      saves = await SavedPost.count({ where: { postId } });
      await redis.set(key, saves);
    }

    return res.json({ postId, saves });
  } catch (err) {
    console.error("Get save count error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
