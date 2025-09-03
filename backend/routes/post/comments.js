const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { Comment, Post, User, CommentLike, sequelize } = require('../../models');
const redis = require('../../utils/redis');

// Redis helpers
const commentKey = (postId) => `post:${postId}:comments`;
const commentLikeKey = (commentId) => `comment:${commentId}:likes`;

// =====================
// CREATE COMMENT / REPLY
// =====================
router.post('/:postId/comment', auth, async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;
  const { content, parentId } = req.body;

  if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

  try {
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // If parentId is provided, check that parent exists
    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment) return res.status(404).json({ error: 'Parent comment not found' });
    }

    const comment = await sequelize.transaction(async (tx) => {
      const newComment = await Comment.create(
        { userId, postId, content: content.trim(), parentId: parentId || null },
        { transaction: tx }
      );

      // Update Redis comment count
      try {
        const key = commentKey(postId);
        const current = await redis.get(key);
        if (current !== null) await redis.incr(key);
        else {
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

// =====================
// UPDATE COMMENT
// =====================
router.put('/comment/:id', auth, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

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

// =====================
// DELETE COMMENT
// =====================
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

      // Update Redis comment count
      try {
        const key = commentKey(postId);
        const current = await redis.get(key);
        if (current !== null && parseInt(current, 10) > 0) await redis.decr(key);
        else {
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

// =====================
// GET COMMENTS WITH REPLIES
// =====================
router.get('/:postId/comments', async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  try {
    const comments = await Comment.findAll({
      where: { postId, parentId: null },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'username', 'profileImageUrl'] },
        {
          model: Comment,
          as: 'replies',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'username', 'profileImageUrl'] }],
          order: [['createdAt', 'ASC']]
        }
      ],
      order: [['createdAt', 'ASC']],
      limit,
      offset: (page - 1) * limit
    });

    return res.json({ data: comments });
  } catch (err) {
    console.error('Get comments error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// =====================
// COMMENT LIKE / UNLIKE
// =====================
router.post('/comment/:id/like', auth, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const comment = await Comment.findByPk(id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const key = commentLikeKey(id);

    const [like, created] = await CommentLike.findOrCreate({
      where: { userId, commentId: id }
    });

    if (!created) {
      // already liked → unlike
      await like.destroy();
      if (await redis.exists(key)) await redis.decr(key);
      return res.json({ message: 'Comment unliked' });
    } else {
      // new like
      if (await redis.exists(key)) await redis.incr(key);
      else {
        const count = await CommentLike.count({ where: { commentId: id } });
        await redis.set(key, count);
      }
      return res.json({ message: 'Comment liked' });
    }
  } catch (err) {
    console.error('Comment like/unlike error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// =====================
// GET COMMENT LIKE STATUS (for current user)
// =====================
router.get('/comment/:id/like-status', auth, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const like = await CommentLike.findOne({
      where: { userId, commentId: id }
    });

    return res.json({ isLiked: !!like });
  } catch (err) {
    console.error('Get comment like status error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// =====================
// GET COMMENT LIKE COUNT
// =====================
router.get('/comment/:id/likes', async (req, res) => {
  const { id } = req.params;
  const key = commentLikeKey(id);

  try {
    let count;
    const cached = await redis.get(key);
    if (cached !== null) count = parseInt(cached, 10);
    else {
      count = await CommentLike.count({ where: { commentId: id } });
      await redis.set(key, count);
    }
    return res.json({ commentId: id, likes: count });
  } catch (err) {
    console.error('Get comment likes error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// =====================
// GET COMMENT COUNT (for a post)
// =====================
router.get('/:postId/comment-count', async (req, res) => {
  const { postId } = req.params;
  const key = commentKey(postId);

  try {
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