# YShare Setup Guide

## Quick Start

### Step 1: Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up MongoDB Atlas:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Create a database user
   - Whitelist your IP (or use `0.0.0.0/0` for development)
   - Get your connection string

3. **Create `.env` file in `backend/` directory:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yshare?retryWrites=true&w=majority
   PORT=3000
   ```

4. **Test locally:**
   ```bash
   npm start
   ```
   Server should start on `http://localhost:3000`

### Step 2: Deploy Backend to Render

1. **Create Render account:**
   - Go to [Render](https://render.com)
   - Sign up for free tier

2. **Create new Web Service:**
   - Connect your GitHub repository
   - Select the `backend` folder as root
   - Build command: `npm install`
   - Start command: `npm start`

3. **Set Environment Variables in Render:**
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `PORT`: (Render sets this automatically)

4. **Note your Render URL:**
   - It will be something like: `https://yshare-backend.onrender.com`

### Step 3: Extension Setup

1. **Load Extension in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` folder

2. **Configure Backend URL (if using Render):**
   
   **Option A: Set via Chrome DevTools**
   - Open extension popup
   - Right-click → Inspect
   - Go to Console tab
   - Run:
     ```javascript
     chrome.storage.local.set({ backendUrl: 'https://your-backend.onrender.com' });
     ```

   **Option B: Edit background.js directly**
   - Change the default in `getBackendUrl()` function
   - Or modify the default return value

3. **Test the Extension:**
   - Click the extension icon
   - Create a new room
   - Share the room code with a friend
   - Navigate to a YouTube video
   - Click "Share to Friend" button

## Troubleshooting

### Backend Issues

- **MongoDB Connection Error:**
  - Check your connection string format
  - Ensure IP is whitelisted in MongoDB Atlas
  - Verify database user credentials

- **Change Streams Not Working:**
  - MongoDB Atlas free tier supports Change Streams
  - Ensure you're using a replica set (Atlas provides this by default)

### Extension Issues

- **Button Not Appearing on YouTube:**
  - YouTube's DOM structure changes frequently
  - Try refreshing the page
  - Check browser console for errors

- **WebSocket Connection Failed:**
  - Verify backend URL is correct
  - Check if backend is running
  - For Render, ensure service is not sleeping (free tier sleeps after inactivity)

- **Notifications Not Working:**
  - Check Chrome notification permissions
  - Go to `chrome://settings/content/notifications`
  - Ensure extension has notification permission

## Development Notes

- **Local Development:**
  - Backend: `http://localhost:3000`
  - Extension uses this by default

- **Production:**
  - Update `backendUrl` in extension storage
  - Or modify `background.js` default URL

## Testing with Two Users

1. User A: Create a room, get room code (e.g., "ABC123")
2. User B: Join room with code "ABC123"
3. User A: Share a YouTube video
4. User B: Should receive notification and see video in history

## API Endpoints

- `POST /api/room/create` - Create room
- `POST /api/room/join` - Join room (body: `{ code: "ABC123" }`)
- `GET /api/history/:roomCode` - Get shared videos
- `POST /api/share` - Share video (also via WebSocket)

## WebSocket Events

- Client → Server: `join_room` (roomCode)
- Client → Server: `share_video` (data)
- Server → Client: `new_share` (data)

