const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
});

const memberSchema = new mongoose.Schema({
    socketId: { type: String, required: true },
    roomCode: { type: String, required: true },
    name: { type: String }
});

const messageSchema = new mongoose.Schema({
    roomCode: { type: String, required: true },
    videoUrl: { type: String, required: true },
    title: { type: String },
    comment: { type: String },
    timestamp: { type: Date, default: Date.now }
});

const Room = mongoose.model('Room', roomSchema);
const Member = mongoose.model('Member', memberSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { Room, Member, Message };
