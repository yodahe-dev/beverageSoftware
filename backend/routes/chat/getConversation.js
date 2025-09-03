const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { Chat } = require('../../models');
const { Op } = require('sequelize');
const { getConversationId } = require('../../services/chatService');


router.get('/chat/conversation/:otherUserId', auth, async (req, res) => {
  const userId = req.user.id;
  const { otherUserId } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const before = req.query.before;

  if (!otherUserId) {
    return res.status(400).json({ error: "otherUserId required" });
  }

  const conversationId = getConversationId(userId, otherUserId);
  const where = { conversationId };

  // Pagination cursor: before = messageId or date
  if (before) {
    let pivot;
    try {
      pivot = await Chat.findOne({ where: { id: before, conversationId } });
    } catch {}
    if (pivot) {
      where.createdAt = { [Op.lt]: pivot.createdAt };
    } else {
      const d = new Date(before);
      if (!isNaN(d)) {
        where.createdAt = { [Op.lt]: d };
      }
    }
  }

  try {
    const messages = await Chat.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit
    });

    // Auto-mark unseen messages as seen if current user is receiver
    const toMark = messages.filter(m => !m.isSeen && m.receiverId === userId);
    if (toMark.length) {
      await Promise.all(
        toMark.map(async (m) => {
          m.isSeen = true;
          m.seenAt = new Date();
          await m.save();

          // Emit real-time seen event to sender
          const io = req.app.get('io'); // io is set in server.js
          if (io) {
            io.to(m.senderId).emit('message:seen', {
              messageId: m.id,
              seenAt: m.seenAt,
              isSeen: true
            });
          }
        })
      );
    }

    // Check if there are older messages
    let hasMore = false;
    if (messages.length) {
      const last = messages[messages.length - 1];
      const countOlder = await Chat.count({
        where: {
          conversationId,
          createdAt: { [Op.lt]: last.createdAt }
        }
      });
      hasMore = countOlder > 0;
    }

    return res.json({
      messages,
      hasMore
    });
  } catch (err) {
    console.error('fetch conversation error', err);
    return res.status(500).json({ error: "Server error" });
  }
});



module.exports = router;
