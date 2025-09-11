const jwt = require('jsonwebtoken');
const { Chat } = require('../models');
const { getConversationId } = require('../services/chatService');
const userSockets = new Map();
const fs = require('fs');
const path = require('path');

module.exports = function setupSocket(io) {
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers['authorization'] || '').split(' ')[1];
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: payload.id || payload.user?.id };
      return next();
    } catch (e) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    if (!userId) return;

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);
    io.emit('presence:update', { userId, status: 'online' });

    socket.on('join:chat', ({ chatId }) => {
      socket.join(`chat_${chatId}`);
    });

    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to(`chat_${chatId}`).emit('typing', {
        from: userId,
        chatId,
        isTyping,
      });
    });

    // Text message
    socket.on('message:send', async ({ receiverId, message }) => {
      try {
        if (!receiverId || !message || typeof message !== 'string') return;

        const content = { type: 'text', body: message.trim(), meta: {} };

        const newMsg = await Chat.create({
          senderId: userId,
          receiverId,
          conversationId: getConversationId(userId, receiverId),
          content,
          isSeen: false,
          seenAt: null,
          isDeleted: false,
        });

        const payload = newMsg.toJSON();

        // Send to receiver
        if (userSockets.has(receiverId)) {
          for (const sid of userSockets.get(receiverId)) {
            io.to(sid).emit('message:new', payload);
          }
        }

        // Send to sender
        if (userSockets.has(userId)) {
          for (const sid of userSockets.get(userId)) {
            io.to(sid).emit('message:new', payload);
          }
        }
      } catch (e) {
        console.error('Failed to send message via socket', e);
      }
    });

    // Voice message only
    socket.on('message:file', async (data, callback) => {
      try {
        if (data.type !== 'voice' || !data.receiverId || !data.file) {
          return callback?.({ success: false, error: 'Invalid voice data' });
        }

        const conversationId = getConversationId(userId, data.receiverId);
        const voiceDir = path.join(__dirname, '..', 'uploads', 'chat', conversationId, 'voices');
        if (!fs.existsSync(voiceDir)) fs.mkdirSync(voiceDir, { recursive: true });

        // Remove data URL prefix
        const base64Data = data.file.includes(',') ? data.file.split(',')[1] : data.file;
        const buffer = Buffer.from(base64Data, 'base64');

        // Max 20 MB
        if (buffer.length > 20 * 1024 * 1024) {
          return callback?.({ success: false, error: 'Voice file too large (max 20MB)' });
        }

        // Generate file name: Day-YYYY-MM-DD-HH-MM-SS
        const now = new Date();
        const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
        let fileName = `${dayName}-${now.getFullYear()}-${(now.getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getHours()
          .toString()
          .padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds()
          .toString()
          .padStart(2, '0')}.webm`;

        // Avoid overwriting
        let filePath = path.join(voiceDir, fileName);
        let counter = 1;
        while (fs.existsSync(filePath)) {
          fileName = `${dayName}-${now.getFullYear()}-${(now.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getHours()
            .toString()
            .padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds()
            .toString()
            .padStart(2, '0')}_${counter}.webm`;
          filePath = path.join(voiceDir, fileName);
          counter++;
        }

        fs.writeFileSync(filePath, buffer);

        const content = {
          type: 'voice',
          url: `/uploads/chat/${conversationId}/voices/${fileName}`,
          name: fileName,
          size: buffer.length,
        };

        const newMsg = await Chat.create({
          senderId: userId,
          receiverId: data.receiverId,
          conversationId,
          content,
          isSeen: false,
          seenAt: null,
          isDeleted: false,
        });

        const payload = newMsg.toJSON();

        // Send to receiver
        if (userSockets.has(data.receiverId)) {
          for (const sid of userSockets.get(data.receiverId)) {
            io.to(sid).emit('message:new', payload);
          }
        }

        // Send to sender
        if (userSockets.has(userId)) {
          for (const sid of userSockets.get(userId)) {
            io.to(sid).emit('message:new', payload);
          }
        }

        callback?.({ success: true, message: payload });
      } catch (err) {
        console.error('Voice upload error:', err);
        callback?.({ success: false, error: err.message });
      }
    });

    // Message seen
    socket.on('message:seen', async ({ messageId }) => {
      try {
        const msg = await Chat.findByPk(messageId);
        if (!msg) return;
        if (msg.receiverId !== userId) return;

        if (!msg.isSeen) {
          msg.isSeen = true;
          msg.seenAt = new Date();
          await msg.save();
        }

        const seenPayload = {
          messageId: msg.id,
          seenAt: msg.seenAt,
          isSeen: msg.isSeen,
        };

        const senderId = msg.senderId;
        if (userSockets.has(senderId)) {
          for (const sid of userSockets.get(senderId)) {
            io.to(sid).emit('message:seen', seenPayload);
          }
        }

        socket.emit('message:seen:ack', seenPayload);
      } catch (e) {
        console.error('Socket seen error', e);
      }
    });

    socket.on('disconnect', () => {
      if (userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
          io.emit('presence:update', { userId, status: 'offline' });
        }
      }
    });
  });
};
