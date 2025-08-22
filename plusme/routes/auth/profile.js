const express = require('express');
const router = express.Router();
const { Op, fn, col } = require('sequelize');
const auth = require('../../middlewares/auth');
const { User, sequelize } = require('../../models');
const sanitizeHtml = require('sanitize-html');
const { QuillDeltaToHtmlConverter } = require('quill-delta-to-html');
const redis = require('../../utils/redis');

function sanitizeBioHtml(html) {
  return sanitizeHtml(html, {
    allowedTags: ['b', 'i', 'u', 'a', 'strong', 'em', 'p', 'br', 'ul', 'li', 'ol'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          href: attribs.href || '',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    },
  });
}

function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

const PROFILE_CACHE_TTL = 600;

router.get('/profile', auth, async (req, res) => {
  try {
    const cacheKey = `profile:${req.user.id}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'username', 'createdAt', 'bio', 'profileImageUrl', 'openChat', 'status', 'visibility'],
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const response = { user };
    await redis.set(cacheKey, JSON.stringify(response), 'EX', PROFILE_CACHE_TTL);

    res.json(response);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/update', auth, async (req, res) => {
  const { name, username, bio, profileImageUrl, openChat, status, visibility } = req.body;
  const errors = [];

  if (username !== undefined) {
    if (typeof username !== 'string') errors.push('Invalid username');
    else {
      const t = username.trim();
      if (t.length < 3) errors.push('Username too short');
      if (t.length > 40) errors.push('Username too long');
      if (!isValidUsername(t)) errors.push('Invalid characters in username');
    }
  }

  if (name !== undefined) {
    if (typeof name !== 'string') errors.push('Invalid name');
    else {
      const t = name.trim();
      if (t.length < 3) errors.push('Name too short');
      if (t.length > 50) errors.push('Name too long');
    }
  }

  if (bio !== undefined) {
    if (typeof bio !== 'object' || !Array.isArray(bio.ops)) errors.push('Invalid bio format');
  }

  if (profileImageUrl !== undefined) {
    if (typeof profileImageUrl !== 'string' || !profileImageUrl.trim()) errors.push('Invalid profile image URL');
  }

  if (openChat !== undefined) {
    if (typeof openChat !== 'boolean') errors.push('Invalid openChat value');
  }

  if (status !== undefined) {
    if (typeof status !== 'string') errors.push('Invalid status');
  }

  if (visibility !== undefined) {
    if (!['public', 'private'].includes(visibility)) errors.push('Invalid visibility value');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (username !== undefined) {
      const normalized = username.trim().toLowerCase();
      const existing = await User.findOne({
        where: sequelize.where(fn('lower', col('username')), normalized),
        attributes: ['id'],
      });
      if (existing && existing.id !== user.id) {
        return res.status(409).json({ message: 'Username already taken' });
      }
      user.username = normalized;
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (bio !== undefined) {
      let html;
      try {
        const converter = new QuillDeltaToHtmlConverter(bio.ops, {});
        html = converter.convert();
      } catch {
        return res.status(400).json({ message: 'Failed to convert bio delta' });
      }
      user.bio = sanitizeBioHtml(html);
    }

    if (profileImageUrl !== undefined) {
      user.profileImageUrl = profileImageUrl.trim();
    }

    if (openChat !== undefined) {
      user.openChat = openChat;
    }

    if (status !== undefined) {
      user.status = status.trim();
    }

    if (visibility !== undefined) {
      user.visibility = visibility;
    }

    await user.save();

    await redis.del(`profile:${req.user.id}`); // clear cache after update

    res.json({ message: 'Profile updated' });
  } catch (saveErr) {
    if (saveErr.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Username already taken' });
    }
    console.error('Save user failed:', saveErr);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
