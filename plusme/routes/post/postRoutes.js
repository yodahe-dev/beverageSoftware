const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { Op } = require('sequelize');
const { Post, User, Follow } = require('../../models'); // Added User + Follow
const sanitizeHtml = require('sanitize-html');
const redis = require('../../utils/redis');

const REDIS_TTL = 3600; // 1 hour cache

const ALLOWED_VIS = ['public', 'private', 'friends', 'community'];

const sanitizeOptions = {
  allowedTags: false,
  allowedAttributes: false,
  disallowedTagsMode: 'discard',
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  enforceHtmlBoundary: true,
  transformTags: {
    'script': () => ({ tagName: 'noscript' })
  },
  exclusiveFilter: (frame) => {
    if (!frame.attribs) return false;
    for (const attr in frame.attribs) {
      if (attr.toLowerCase().startsWith('on')) return true;
    }
    return false;
  }
};

// helper: update post count in redis
async function updatePostsCount(userId) {
  const redisKey = `user:${userId}:posts_count`;
  const count = await Post.count({ where: { authorId: userId } });
  await redis.set(redisKey, count, 'EX', REDIS_TTL);
}

async function getCounts(userId) {
  const redisKey = `user:${userId}:counts`;
  let cached = await redis.get(redisKey);
  if (cached) return JSON.parse(cached);

  const posts = await Post.count({ where: { authorId: userId } });
  const followers = await Follow.count({ where: { FollowingId: userId } });
  const following = await Follow.count({ where: { FollowerId: userId } });

  const counts = { posts, followers, following };
  await redis.set(redisKey, JSON.stringify(counts), 'EX', REDIS_TTL);
  return counts;
}

// Create new post
router.post('/newpost', auth, async (req, res) => {
  const authorId = req.user.id;
  let { title, description, contentJson, imageUrl, visibility, communityId } = req.body;

  if (!contentJson) return res.status(400).json({ error: "Content is required" });
  if (!title || typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: "Title is required" });

  title = title.trim();
  if (title.length > 100) return res.status(400).json({ error: "Max title length is 100 characters" });

  if (!ALLOWED_VIS.includes(visibility)) visibility = 'public';
  if (visibility === 'community' && !communityId) return res.status(400).json({ error: "communityId required" });

  try {
    const safeContent = sanitizeHtml(contentJson, sanitizeOptions);

    const newPost = await Post.create({
      authorId,
      title,
      description: description || null,
      contentJson: safeContent,
      imageUrl: imageUrl || null,
      visibility,
      communityId: visibility === 'community' ? communityId : null,
    });

    // Update posts count in Redis
    await updatePostsCount(authorId);

    return res.status(201).json({ message: "Post created", data: newPost });
  } catch (err) {
    console.error("Post creation error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Update post by ID
router.put('/postupdate/:id', auth, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  let { title, contentJson, imageUrl, visibility, communityId } = req.body;

  try {
    const post = await Post.findByPk(id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.authorId !== userId) return res.status(403).json({ error: "Not allowed" });

    if (!contentJson) return res.status(400).json({ error: "Content is required" });
    if (!title || typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: "Title is required" });
    title = title.trim();
    if (title.length > 100) return res.status(400).json({ error: "Max title length is 100 characters" });

    if (!ALLOWED_VIS.includes(visibility)) visibility = 'public';
    if (visibility === 'community' && !communityId) return res.status(400).json({ error: "communityId required" });

    post.title = title;
    post.contentJson = sanitizeHtml(contentJson, sanitizeOptions);
    post.imageUrl = imageUrl || null;
    post.visibility = visibility;
    post.communityId = visibility === 'community' ? communityId : null;

    await post.save();

    // Update posts count in Redis
    await updatePostsCount(userId);

    return res.json({ message: "Post updated", data: post });
  } catch (err) {
    console.error("Update post error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Delete post
router.delete('/postdelete/:id', auth, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const post = await Post.findByPk(id, { paranoid: false });
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.authorId !== userId) return res.status(403).json({ error: "Not allowed" });

    await post.destroy({ force: true });

    // Update posts count in Redis
    await updatePostsCount(userId);

    return res.json({ message: "Post permanently deleted" });
  } catch (err) {
    console.error("Post delete error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get my posts
router.get('/myposts', auth, async (req, res) => {
  const userId = req.user.id;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const { cursor, q, order } = req.query;

  const where = { authorId: userId };
  if (q) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${q}%` } },
      { contentJson: { [Op.contains]: { body: q } } },
    ];
  }

  if (cursor) {
    if (isNaN(Date.parse(cursor))) {
      const pivot = await Post.findByPk(cursor);
      if (pivot && pivot.authorId === userId) where.createdAt = { [Op.lt]: pivot.createdAt };
    } else {
      const dt = new Date(cursor);
      if (!isNaN(dt)) where.createdAt = { [Op.lt]: dt };
    }
  }

  try {
    const posts = await Post.findAll({
      where,
      order: [['createdAt', order === 'ASC' ? 'ASC' : 'DESC']],
      limit,
    });

    const nextCursor = posts.length === limit ? posts[posts.length - 1].createdAt.toISOString() : null;

    return res.json({
      data: posts,
      paging: { nextCursor, limit, order: order || 'DESC' }
    });
  } catch (err) {
    console.error('fetch my posts error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get posts count by userId
router.get('/users/:userId', async (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  const redisKey = `user:${userId}:posts_count`;

  try {
    let cachedCount = await redis.get(redisKey);
    if (cachedCount !== null) return res.json({ posts: parseInt(cachedCount) });

    const postsCount = await Post.count({ where: { authorId: userId } });
    await redis.set(redisKey, postsCount, 'EX', REDIS_TTL);

    res.json({ posts: postsCount });
  } catch (err) {
    console.error('Posts Count Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get posts by userId
router.get('/users/:userId/posts', async (req, res) => {
  const { userId } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const { cursor, order } = req.query;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const where = { authorId: user.id };

    if (cursor) {
      if (isNaN(Date.parse(cursor))) {
        const pivot = await Post.findByPk(cursor);
        if (pivot && pivot.authorId === user.id) where.createdAt = { [Op.lt]: pivot.createdAt };
      } else {
        const dt = new Date(cursor);
        if (!isNaN(dt)) where.createdAt = { [Op.lt]: dt };
      }
    }

    const posts = await Post.findAll({
      where,
      order: [['createdAt', order === 'ASC' ? 'ASC' : 'DESC']],
      limit,
    });

    const nextCursor = posts.length === limit ? posts[posts.length - 1].createdAt.toISOString() : null;

    return res.json({
      data: posts,
      paging: { nextCursor, limit, order: order || 'DESC' },
    });
  } catch (err) {
    console.error('Fetch user posts error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.get('/by-username/:username', async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ where: { username } });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ id: user.id, username: user.username });
});


module.exports = router;
