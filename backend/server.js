require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const { Message } = require('./models');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use('/api', routes);

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yshare';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        setupChangeStreams();
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });

// Setup MongoDB Change Streams to watch for new messages
function setupChangeStreams() {
    const changeStream = Message.watch();

    changeStream.on('change', (change) => {
        if (change.operationType === 'insert') {
            const newMessage = change.fullDocument;
            console.log('New message detected via Change Stream:', newMessage);
            
            // Emit to all sockets in the room
            io.to(newMessage.roomCode).emit('new_share', {
                roomCode: newMessage.roomCode,
                videoUrl: newMessage.videoUrl,
                title: newMessage.title,
                comment: newMessage.comment,
                timestamp: newMessage.timestamp
            });
        }
    });

    changeStream.on('error', (error) => {
        console.error('Change Stream error:', error);
    });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join_room', (roomCode) => {
        socket.join(roomCode);
        console.log(`Socket ${socket.id} joined room ${roomCode}`);
    });

    socket.on('share_video', async (data) => {
        // data: { roomCode, videoUrl, title, comment, timestamp }
        console.log('Received video share:', data);
        
        try {
            // Save to database - Change Stream will handle the broadcast
            const message = new Message({
                roomCode: data.roomCode,
                videoUrl: data.videoUrl,
                title: data.title,
                comment: data.comment,
                timestamp: data.timestamp || new Date()
            });
            
            await message.save();
            console.log('Message saved to database');
        } catch (error) {
            console.error('Error saving message:', error);
            // Fallback: broadcast directly if DB save fails
            socket.to(data.roomCode).emit('new_share', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
