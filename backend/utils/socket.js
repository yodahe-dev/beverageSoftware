const jwt = require('jsonwebtoken');
const { Chat } = require('../models');
const { getConversationId } = require('../services/chatService');
const userSockets = new Map();
const chatUpload = require('../middlewares/chatUpload');
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

        // Store plain text in DB
        const content = {
          type: 'text',
          body: message.trim(),
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

    // File message (image/audio)
    socket.on('message:file', async (data, callback) => {
      try {
        if (!data.type || !data.receiverId) {
          return callback?.({ success: false, error: 'Missing type or receiverId' });
        }

        const conversationId = getConversationId(userId, data.receiverId);
        let contentFiles = [];

        if (data.type === 'image') {
          if (!data.files || !Array.isArray(data.files) || data.files.length === 0) {
            return callback?.({ success: false, error: 'No image files provided' });
          }

          contentFiles = data.files.map((f) => ({
            type: 'image',
            url: `/uploads/chat/${conversationId}/images/${f.filename}`,
            name: f.originalname,
            size: f.size,
          }));
        } else if (data.type === 'voice') {
          if (!data.file) {
            return callback?.({ success: false, error: 'No voice file provided' });
          }

          // Remove data URL prefix if present
          const base64Data = data.file.includes(',')
            ? data.file.split(',')[1]
            : data.file;

          const voiceDir = path.join(
            __dirname,
            '..',
            'uploads',
            'chat',
            conversationId,
            'voices'
          );
          if (!fs.existsSync(voiceDir)) fs.mkdirSync(voiceDir, { recursive: true });

          const fileName = `voice-${Date.now()}.webm`;
          const filePath = path.join(voiceDir, fileName);
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

          contentFiles.push({
            type: 'voice',
            url: `/uploads/chat/${conversationId}/voices/${fileName}`,
            name: fileName,
            size: fs.statSync(filePath).size,
          });
        } else {
          return callback?.({ success: false, error: 'Invalid file type' });
        }

        const newMsg = await Chat.create({
          senderId: userId,
          receiverId: data.receiverId,
          conversationId,
          content: contentFiles.length === 1 ? contentFiles[0] : contentFiles,
          isSeen: false,
          isDeleted: false,
        });

        const payload = newMsg.toJSON();

        if (userSockets.has(data.receiverId)) {
          for (const sid of userSockets.get(data.receiverId)) {
            io.to(sid).emit('message:new', payload);
          }
        }

        if (userSockets.has(userId)) {
          for (const sid of userSockets.get(userId)) {
            io.to(sid).emit('message:new', payload);
          }
        }

        callback?.({ success: true, message: payload });
      } catch (err) {
        console.error('File upload error:', err);
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
