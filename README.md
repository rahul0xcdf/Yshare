# YShare - YouTube Video Sharing Chrome Extension

YShare is a Chrome extension that lets two users instantly share YouTube videos with each other without having to copy links or send them over WhatsApp. Both users install the extension and pair with each other using a short room code.

## Features

- **Instant Video Sharing**: Share YouTube videos with a single click
- **Real-time Delivery**: Uses WebSockets for instant notifications
- **Room-based Pairing**: Create or join rooms using short 6-character codes
- **Chrome Notifications**: Get notified when a friend shares a video
- **Share History**: View all shared videos in the extension popup
- **Optional Comments**: Add a comment when sharing a video

## Architecture

- **Frontend**: Chrome Extension (Manifest V3)
  - Background Service Worker (maintains WebSocket connection)
  - Content Script (injects "Share to Friend" button on YouTube)
  - Popup UI (room management and history)
  
- **Backend**: Node.js + Express + Socket.IO
  - REST API for room management
  - WebSocket server for real-time communication
  - MongoDB Atlas for data persistence
  - MongoDB Change Streams for real-time message broadcasting

## Setup Instructions

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure MongoDB Atlas**
   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster
   - Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/yshare?retryWrites=true&w=majority`)

3. **Create Environment File**
   Create a `.env` file in the `backend` directory:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yshare?retryWrites=true&w=majority
   PORT=3000
   ```

4. **Run Locally**
   ```bash
   npm start
   ```

5. **Deploy to Render**
   - Create a new Web Service on Render
   - Connect your GitHub repository
   - Set environment variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `PORT`: Will be set automatically by Render
   - Build command: `npm install`
   - Start command: `npm start`

### Extension Setup

1. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `extension` folder

2. **Configure Backend URL** (if not using localhost)
   - Open the extension popup
   - The extension will use `http://localhost:3000` by default
   - To use a Render backend, you can set it in the extension's storage:
     - Open Chrome DevTools → Application → Storage → Local Storage
     - Or modify `background.js` to set the default URL

3. **Using the Extension**
   - Click the extension icon
   - Create a new room or join an existing one using a 6-character code
   - Navigate to any YouTube video
   - Click the "Share to Friend" button
   - Add an optional comment and share!

## Project Structure

```
y_ext/
├── backend/
│   ├── models.js          # MongoDB schemas (Room, Member, Message)
│   ├── routes.js          # REST API routes
│   ├── server.js          # Express server + Socket.IO + Change Streams
│   ├── package.json       # Dependencies
│   └── .env               # Environment variables (create this)
├── extension/
│   ├── manifest.json      # Chrome extension manifest
│   ├── background.js      # Service worker (WebSocket connection)
│   ├── content.js         # Injects button on YouTube pages
│   ├── popup/
│   │   ├── popup.html     # Popup UI
│   │   ├── popup.js       # Popup logic
│   │   └── popup.css      # Popup styles
│   └── assets/
│       └── icon128.png    # Extension icon
└── README.md
```

## API Endpoints

- `POST /api/room/create` - Create a new room
- `POST /api/room/join` - Join an existing room
- `POST /api/share` - Share a video (also handled via WebSocket)
- `GET /api/history/:roomCode` - Get shared video history

## WebSocket Events

- `join_room` - Client joins a room
- `share_video` - Client shares a video
- `new_share` - Server broadcasts new video share to room members

## Technologies Used

- **Chrome Extension API** (Manifest V3)
- **Node.js** + **Express**
- **Socket.IO** (WebSockets)
- **MongoDB Atlas** (Cloud Database)
- **Mongoose** (MongoDB ODM)
- **MongoDB Change Streams** (Real-time database events)

## Notes

- The extension stores room codes and history in Chrome's local storage
- MongoDB Change Streams ensure all room members receive shares in real-time
- Notifications open the shared YouTube video when clicked
- Room codes are 6-character alphanumeric strings (uppercase)

## License

ISC

