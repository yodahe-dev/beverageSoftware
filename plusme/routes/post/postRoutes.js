const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { Op } = require('sequelize');
const { Post } = require('../../models');
const sanitizeHtml = require('sanitize-html');

const ALLOWED_VIS = ['public', 'private', 'friends', 'community'];

// Allow ALL tags & attributes but strip scripts & dangerous protocols
const sanitizeOptions = {
  allowedTags: false, // false = allow all tags
  allowedAttributes: false, // false = allow all attributes
  disallowedTagsMode: 'discard',
  allowedSchemes: ['http', 'https', 'mailto'], // block javascript:, data:, vbscript:
  allowProtocolRelative: false,
  enforceHtmlBoundary: true, // avoid escaping outside HTML
  transformTags: {
    'script': function () {
      return { tagName: 'noscript' }; // replace <script> with harmless tag
    }
  },
  // Remove event handlers like onclick, onerror, etc.
  exclusiveFilter: (frame) => {
    if (!frame.attribs) return false;
    for (const attr in frame.attribs) {
      if (attr.toLowerCase().startsWith('on')) return true; // strip elements with inline JS
    }
    return false;
  }
};

router.post('/newpost', auth, async (req, res) => {
  const authorId = req.user.id;
  let { title, description, contentJson, imageUrl, visibility, communityId } = req.body;

  if (!contentJson) return res.status(400).json({ error: "Content is required" });
  if (!title) return res.status(400).json({ error: "Title is required" });
  if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: "Title must be a non-empty string" });

  title = title.trim();
  if (title.length > 100) return res.status(400).json({ error: "Max title length is 100 characters" });

  if (!visibility || !ALLOWED_VIS.includes(visibility)) {
    visibility = 'public';
  }

  if (visibility === 'community' && !communityId) {
    return res.status(400).json({ error: "communityId is required when visibility is 'community'" });
  }

  try {
    // sanitize before saving (all HTML allowed except scripts/injections)
    const safeContent = sanitizeHtml(contentJson, sanitizeOptions);

    const newPost = await Post.create({
      authorId,
      title,
      description: description || null,
      contentJson: safeContent, // only sanitized content stored
      imageUrl: imageUrl || null,
      visibility,
      communityId: visibility === 'community' ? communityId : null,
    });

    return res.status(201).json({ message: "Post created", data: newPost });
  } catch (err) {
    console.error("Post creation error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Update post by id
router.put('/postupdate/:id', auth, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  let { title, contentJson, imageUrl, visibility, communityId } = req.body;

  try {
    const post = await Post.findByPk(id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.authorId !== userId) return res.status(403).json({ error: "Not allowed" });

    if (!contentJson) return res.status(400).json({ error: "Content is required" });
    if (!title) return res.status(400).json({ error: "Title is required" });
    if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: "Title must be a non-empty string" });
    title = title.trim();
    if (title.length > 100) return res.status(400).json({ error: "Max title length is 100 characters" });

    if (!visibility || !ALLOWED_VIS.includes(visibility)) {
      visibility = 'public';
    }

    if (visibility === 'community' && !communityId) {
      return res.status(400).json({ error: "communityId is required when visibility is 'community'" });
    }

    post.title = title;
    post.contentJson = contentJson;
    post.imageUrl = imageUrl || null;
    post.visibility = visibility;
    post.communityId = visibility === 'community' ? communityId : null;

    await post.save();
    return res.json({ message: "Post updated", data: post });
  } catch (err) {
    console.error("Update post error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete('/postdelete/:id', auth, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const post = await Post.findByPk(id, { paranoid: false });
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.authorId !== userId) return res.status(403).json({ error: "Not allowed" });

    await post.destroy({ force: true });
    return res.json({ message: "Post permanently deleted" });
  } catch (err) {
    console.error("Post delete error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get('/myposts', auth, async (req, res) => {
  const userId = req.user.id;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const { cursor, q } = req.query;

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
      if (pivot && pivot.authorId === userId) {
        where.createdAt = { [Op.lt]: pivot.createdAt };
      }
    } else {
      const dt = new Date(cursor);
      if (!isNaN(dt)) where.createdAt = { [Op.lt]: dt };
    }
  }

  try {
    const posts = await Post.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
    });

    let nextCursor = null;
    if (posts.length === limit) {
      nextCursor = posts[posts.length - 1].createdAt.toISOString();
    }

    return res.json({
      data: posts,
      paging: {
        nextCursor,
        limit,
      },
    });
  } catch (err) {
    console.error('fetch my posts error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
