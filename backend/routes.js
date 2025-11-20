const express = require('express');
const router = express.Router();
const { Room, Member, Message } = require('./models');

// Helper to generate a random 6-character code
const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Create a new room
router.post('/room/create', async (req, res) => {
    try {
        let code = generateRoomCode();
        // Ensure uniqueness (simple check)
        while (await Room.findOne({ code })) {
            code = generateRoomCode();
        }

        const room = new Room({ code });
        await room.save();

        res.json({ success: true, code });
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Join a room (validation only, socket handles the actual joining)
router.post('/room/join', async (req, res) => {
    try {
        const { code } = req.body;
        const room = await Room.findOne({ code });

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        res.json({ success: true, code });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Share a video
router.post('/share', async (req, res) => {
    try {
        const { roomCode, videoUrl, title, comment } = req.body;

        if (!roomCode || !videoUrl) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const message = new Message({
            roomCode,
            videoUrl,
            title,
            comment
        });

        await message.save();
        res.json({ success: true, message });
    } catch (error) {
        console.error('Share error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get history
router.get('/history/:roomCode', async (req, res) => {
    try {
        const { roomCode } = req.params;
        const messages = await Message.find({ roomCode }).sort({ timestamp: -1 }).limit(50);
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
