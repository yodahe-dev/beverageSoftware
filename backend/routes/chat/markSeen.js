const express = require("express");
const router = express.Router();
const auth = require('../../middlewares/auth');
const { Chat, User } = require('../../models');
const { Op } = require('sequelize');
const redis = require('../../utils/redis');
const { getUserStatus } = require('../../utils/status'); // import your helper

// Mark message as seen
router.post('/:messageId/seen', auth, async (req, res) => {
  const userId = req.user.id;
  const { messageId } = req.params;

  try {
    const msg = await Chat.findByPk(messageId);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    if (msg.receiverId !== userId)
      return res.status(403).json({ error: "Only receiver can mark as seen" });

    if (!msg.isSeen) {
      msg.isSeen = true;
      msg.seenAt = new Date();
      await msg.save();

      // Emit real-time event to sender
      const io = req.app.get('io');
      if (io) {
        io.to(msg.senderId).emit('message:seen', {
          messageId: msg.id,
          seenAt: msg.seenAt,
          isSeen: true,
        });
      }
    }

    // Update last active for current user in Redis
    await redis.set(`user:lastActive:${userId}`, Date.now());

    // Get sender online status
    const senderStatus = await getUserStatus(msg.senderId);

    return res.json({
      message: "Seen",
      data: msg,
      senderStatus,
    });

  } catch (err) {
    console.error("mark seen error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get('/list', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const chats = await Chat.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ],
      },
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'name', 'profileImageUrl', 'isBadgeVerified'] },
        { model: User, as: 'receiver', attributes: ['id', 'username', 'name', 'profileImageUrl', 'isBadgeVerified'] },
      ],
    });
    const chatUsersMap = {};
    chats.forEach(c => {
      const otherUser = c.senderId === userId ? c.receiver : c.sender;
      if (!chatUsersMap[otherUser.id]) {
        chatUsersMap[otherUser.id] = {
          id: otherUser.id,
          username: otherUser.username,
          name: otherUser.name,
          profileImageUrl: otherUser.profileImageUrl,
          isBadgeVerified: otherUser.isBadgeVerified,
          lastMessage: c.content,
          isSeen: c.isSeen,
          seenAt: c.seenAt,
          lastMessageAt: c.createdAt,
        };
      }
    });
    const chatUsers = await Promise.all(Object.values(chatUsersMap).map(async u => {
      const status = await getUserStatus(u.id);
      return {
        ...u,
        online: status.online,
      };
    }));
    chatUsers.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    return res.json({ success: true, data: chatUsers });

  } catch (err) {
    console.error("Chat list error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
