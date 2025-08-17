const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { Comment, Post, User, sequelize } = require('../../models');
const redis = require('../../utils/redis');

// Redis key helper for comment count
function commentKey(postId) {
  return `post:${postId}:comments`;
}

// Create comment with Redis count increment
router.post('/:postId/comment', auth, async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = await sequelize.transaction(async (tx) => {
      const newComment = await Comment.create(
        { userId, postId, content: content.trim() },
        { transaction: tx }
      );

      // Update Redis count
      try {
        const key = commentKey(postId);
        const current = await redis.get(key);
        if (current !== null) {
          await redis.incr(key);
        } else {
          const count = await Comment.count({ where: { postId } });
          await redis.set(key, count);
        }
      } catch (e) {
        console.warn('Redis update on comment create failed', e);
      }

      return newComment;
    });

    return res.status(201).json({ message: 'Comment created', data: comment });
  } catch (err) {
    console.error('Create comment error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update comment content
router.put('/comment/:id', auth, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const comment = await Comment.findByPk(id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId !== userId) return res.status(403).json({ error: 'Not allowed' });

    comment.content = content.trim();
    await comment.save();

    return res.json({ message: 'Comment updated', data: comment });
  } catch (err) {
    console.error('Update comment error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete comment with Redis decrement
router.delete('/comment/:id', auth, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const comment = await Comment.findByPk(id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId !== userId) return res.status(403).json({ error: 'Not allowed' });

    const postId = comment.postId;
    await sequelize.transaction(async (tx) => {
      await comment.destroy({ transaction: tx });

      // Update Redis count
      try {
        const key = commentKey(postId);
        const current = await redis.get(key);
        if (current !== null) {
          const currentInt = parseInt(current, 10);
          if (currentInt > 0) {
            await redis.decr(key);
          }
        } else {
          const count = await Comment.count({ where: { postId } });
          await redis.set(key, count);
        }
      } catch (e) {
        console.warn('Redis update on comment delete failed', e);
      }
    });

    return res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all comments for a post
router.get('/:postId/comments', async (req, res) => {
  const { postId } = req.params;

  try {
    const comments = await Comment.findAll({
      where: { postId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'username', 'profileImageUrl']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    return res.json({ data: comments });
  } catch (err) {
    console.error('Get comments error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all comments by current user
router.get('/my/comments', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const comments = await Comment.findAll({
      where: { userId },
      include: [
        {
          model: Post,
          as: 'post',
          attributes: ['id', 'title']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ data: comments });
  } catch (err) {
    console.error('Get my comments error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get comment count (cached)
router.get('/:postId/comments/count', async (req, res) => {
  const { postId } = req.params;

  try {
    const key = commentKey(postId);
    let count;

    const cached = await redis.get(key);
    if (cached !== null) {
      count = parseInt(cached, 10);
    } else {
      count = await Comment.count({ where: { postId } });
      await redis.set(key, count);
    }

    return res.json({ postId, comments: count });
  } catch (err) {
    console.error('Get comment count error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
