const jwt = require('jsonwebtoken');
const { Chat } = require('../models');
const { getConversationId } = require('../services/chatService');
const userSockets = new Map();

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

    socket.on('message:send', async ({ receiverId, message }) => {
      try {
        if (!receiverId || !message || typeof message !== 'string') return;

        const content = {
          type: 'text',
          body: message,
          meta: {},
        };

        const newMsg = await Chat.create({
          senderId: userId,
          receiverId,
          conversationId: getConversationId(userId, receiverId),
          content,
          isSeen: false,
          isDeleted: false,
        });

        const payload = newMsg.toJSON();

        // Send to receiver
        if (userSockets.has(receiverId)) {
          for (const sid of userSockets.get(receiverId)) {
            io.to(sid).emit('message:new', payload);
          }
        }

        // Send to sender (including current socket)
        if (userSockets.has(userId)) {
          for (const sid of userSockets.get(userId)) {
            io.to(sid).emit('message:new', payload);
          }
        }
      } catch (e) {
        console.error('Failed to send message via socket', e);
      }
    });

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
