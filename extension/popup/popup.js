document.addEventListener('DOMContentLoaded', () => {
  const setupScreen = document.getElementById('setup-screen');
  const mainScreen = document.getElementById('main-screen');
  const roomCodeInput = document.getElementById('room-code-input');
  const joinBtn = document.getElementById('join-btn');
  const createBtn = document.getElementById('create-btn');
  const leaveBtn = document.getElementById('leave-btn');
  const currentRoomCodeDisplay = document.getElementById('current-room-code');
  const historyList = document.getElementById('history-list');
  const connectionStatus = document.getElementById('connection-status');

  // Get backend URL from storage or use default
  let backendUrl = 'http://localhost:3000';
  chrome.storage.local.get(['backendUrl'], (result) => {
    if (result.backendUrl) {
      backendUrl = result.backendUrl;
    }
  });

  // Check initial state
  chrome.storage.local.get(['roomCode', 'history'], (result) => {
    if (result.roomCode) {
      showMainScreen(result.roomCode);
      loadHistoryFromBackend(result.roomCode);
      updateConnectionStatus();
    } else {
      showSetupScreen();
    }
    renderHistory(result.history || []);
  });

  // Listen for storage changes (realtime UI updates)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.history) {
        renderHistory(changes.history.newValue);
      }
      if (changes.roomCode) {
        if (changes.roomCode.newValue) {
          showMainScreen(changes.roomCode.newValue);
          loadHistoryFromBackend(changes.roomCode.newValue);
          updateConnectionStatus();
        } else {
          showSetupScreen();
          updateConnectionStatus();
        }
      }
    }
  });

  // Create Room
  createBtn.addEventListener('click', async () => {
    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';
    try {
      const response = await fetch(`${backendUrl}/api/room/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        await joinRoom(data.code);
      } else {
        alert('Failed to create room: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Create room error:', error);
      alert('Failed to create room. Please check your backend connection.');
    } finally {
      createBtn.disabled = false;
      createBtn.textContent = 'Create New Room';
    }
  });

  // Join Room
  joinBtn.addEventListener('click', async () => {
    const code = roomCodeInput.value.trim().toUpperCase();
    if (code.length === 0) {
      alert('Please enter a room code');
      return;
    }
    joinBtn.disabled = true;
    joinBtn.textContent = 'Joining...';
    try {
      const response = await fetch(`${backendUrl}/api/room/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await response.json();
      if (data.success) {
        await joinRoom(code);
      } else {
        alert('Room not found. Please check the room code.');
      }
    } catch (error) {
      console.error('Join room error:', error);
      alert('Failed to join room. Please check your backend connection.');
    } finally {
      joinBtn.disabled = false;
      joinBtn.textContent = 'Join Room';
    }
  });

  // Leave Room
  leaveBtn.addEventListener('click', () => {
    chrome.storage.local.remove('roomCode', () => {
      // Notify background to disconnect/leave
      chrome.runtime.sendMessage({ type: 'LEAVE_ROOM' });
      showSetupScreen();
      updateConnectionStatus();
    });
  });

  async function joinRoom(code) {
    chrome.storage.local.set({ roomCode: code }, async () => {
      // Notify background to connect
      chrome.runtime.sendMessage({ type: 'JOIN_ROOM', roomCode: code });
      showMainScreen(code);
      await loadHistoryFromBackend(code);
      updateConnectionStatus();
    });
  }

  async function loadHistoryFromBackend(roomCode) {
    try {
      const response = await fetch(`${backendUrl}/api/history/${roomCode}`);
      const data = await response.json();
      if (data.success && data.messages) {
        // Convert backend messages to extension format
        const history = data.messages.map(msg => ({
          videoUrl: msg.videoUrl,
          title: msg.title,
          comment: msg.comment,
          timestamp: msg.timestamp,
          sender: 'friend' // Backend doesn't track sender, so we'll mark as friend
        }));
        chrome.storage.local.set({ history });
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  function updateConnectionStatus() {
    chrome.storage.local.get(['roomCode'], (result) => {
      if (result.roomCode) {
        connectionStatus.textContent = 'Connected';
        connectionStatus.className = 'status connected';
      } else {
        connectionStatus.textContent = 'Disconnected';
        connectionStatus.className = 'status disconnected';
      }
    });
  }

  function showSetupScreen() {
    setupScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
    roomCodeInput.value = '';
  }

  function showMainScreen(code) {
    setupScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    currentRoomCodeDisplay.textContent = code;
  }

  function renderHistory(history) {
    historyList.innerHTML = '';
    if (!history || history.length === 0) {
      historyList.innerHTML = '<div class="empty-state">No videos shared yet.</div>';
      return;
    }

    // Sort by timestamp desc
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    history.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';

      const date = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      el.innerHTML = `
        <a href="${item.videoUrl}" target="_blank" class="title">${item.title || 'Untitled Video'}</a>
        <div class="meta">
          <span>${item.sender === 'me' ? 'You sent' : 'Friend sent'}</span>
          <span>${date}</span>
        </div>
        ${item.comment ? `<div class="comment">${item.comment}</div>` : ''}
      `;
      historyList.appendChild(el);
    });
  }
});
