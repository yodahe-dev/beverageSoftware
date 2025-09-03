const express = require('express')
const router = express.Router()
const auth = require('../../middlewares/auth')
const {Chat, User } = require('../../models')
const { getConversationId } = require('../../services/chatService')

router.post('/send', auth, async (req, res) => {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;

    if(!receiverId || !message || typeof message !== 'string') return res.status(400).json({error: "receiverId and Message are required"})
    if (senderId == receiverId) return res.status(400).json({error: "You Can't send message For you self 😁"})
    
    try {
        const receiver = await User.findOne({ where: {id: receiverId}})
        if (!receiver) return res.status(400).json({error: "Receiver not found"})
        
        const ConversationId = getConversationId(senderId, receiverId)

        const content = {
            type: 'text',
            body: message,
            meta: {}
        }

        const newMessage =  await Chat.create({
            senderId,
            receiverId,
            conversationId: getConversationId(senderId, receiverId),
            content,
            isSeen: false,
            isDeleted: false
        });
        
        res.status(201).json({message: "Message sent successfully 🤗", data: newMessage})
    } catch (err) {
        console.error('Send message error', err);
        res.status(500).json({error: "Internal Server Error"})
    }
})

module.exports = router;