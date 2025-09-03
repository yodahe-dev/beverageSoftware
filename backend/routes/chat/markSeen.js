const express = require("express");
const router = express.Router();
const auth = require('../../middlewares/auth');
const { Chat } = require('../../models');

router.post('/:messageId/seen', auth, async (req, res) => {
  const userId = req.user.id;
  const { messageId } = req.params;

  try {
    const msg = await Chat.findByPk(messageId);
    if (!msg) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (msg.receiverId !== userId) {
      return res.status(403).json({ error: "Only receiver can mark as seen" });
    }

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

    return res.json({ message: "Seen", data: msg });
  } catch (err) {
    console.error("mark seen error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
