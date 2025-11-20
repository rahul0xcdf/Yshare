import { io } from './socket.io.esm.min.js';

let socket = null;
const notificationMap = new Map(); // Store notificationId -> videoUrl mapping

// Get backend URL (default to localhost for development)
const getBackendUrl = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['backendUrl'], (result) => {
      resolve(result.backendUrl || 'https://yshare-u0bb.onrender.com');
    });
  });
};

// Initialize connection if room code exists
chrome.storage.local.get(['roomCode'], async (result) => {
  if (result.roomCode) {
    const backendUrl = await getBackendUrl();
    connectSocket(result.roomCode, backendUrl);
  }
});

// Listen for notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  const videoUrl = notificationMap.get(notificationId);
  if (videoUrl) {
    chrome.tabs.create({ url: videoUrl });
    notificationMap.delete(notificationId);
  }
});

// Listen for messages from Popup or Content Script
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'JOIN_ROOM') {
    const backendUrl = await getBackendUrl();
    connectSocket(message.roomCode, backendUrl);
  } else if (message.type === 'LEAVE_ROOM') {
    disconnectSocket();
  } else if (message.type === 'SHARE_VIDEO') {
    handleShareVideo(message.data);
  } else if (message.type === 'SET_BACKEND_URL') {
    chrome.storage.local.set({ backendUrl: message.url });
    // Reconnect if already in a room
    chrome.storage.local.get(['roomCode'], async (result) => {
      if (result.roomCode) {
        disconnectSocket();
        connectSocket(result.roomCode, message.url);
      }
    });
  }
});

async function connectSocket(roomCode, backendUrl) {
  if (socket && socket.connected) {
    socket.emit('join_room', roomCode);
    return;
  }

  if (!backendUrl) {
    backendUrl = await getBackendUrl();
  }

  socket = io(backendUrl);

  socket.on('connect', () => {
    console.log('Socket connected to', backendUrl);
    socket.emit('join_room', roomCode);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('new_share', (data) => {
    console.log('Received new share:', data);
    saveToHistory(data, 'friend');
    showNotification(data);
  });
}

function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

function handleShareVideo(data) {
  if (socket && socket.connected) {
    socket.emit('share_video', data);
    saveToHistory(data, 'me');
  } else {
    console.error('Socket not connected, cannot share');
    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icon128.png'),
      title: 'YShare Error',
      message: 'Not connected. Please check your room connection.',
      priority: 2
    });
  }
}

function saveToHistory(data, sender) {
  chrome.storage.local.get(['history'], (result) => {
    const history = result.history || [];
    // Add sender info
    const entry = { ...data, sender };
    history.push(entry);
    // Keep only last 100 items
    const trimmedHistory = history.slice(-100);
    chrome.storage.local.set({ history: trimmedHistory });
  });
}

function showNotification(data) {
  const notificationId = `yshare-${Date.now()}-${Math.random()}`;

  chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('assets/icon128.png'),
    title: 'New Video Shared!',
    message: `${data.title || 'Untitled Video'}\n${data.comment ? `"${data.comment}"` : ''}`,
    priority: 2
  }, (createdNotificationId) => {
    // Store mapping for click handler
    if (createdNotificationId) {
      notificationMap.set(createdNotificationId, data.videoUrl);
    }
  });
}
