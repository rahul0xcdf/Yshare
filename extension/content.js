// Function to create and inject the button
function injectShareButton() {
  // Check if button already exists
  if (document.getElementById('yshare-btn')) return;

  // Target the actions row (Like, Share, etc.)
  // YouTube selectors can be tricky and change. Try multiple selectors
  const selectors = [
    '#actions #top-level-buttons-computed',
    '#top-level-buttons-computed',
    '#menu-container #top-level-buttons-computed',
    'ytd-menu-renderer #top-level-buttons-computed'
  ];

  let actionsContainer = null;
  for (const selector of selectors) {
    actionsContainer = document.querySelector(selector);
    if (actionsContainer) break;
  }

  // Fallback: try to find any button container near the like/dislike buttons
  if (!actionsContainer) {
    const likeButton = document.querySelector('like-button-view-model button, ytd-toggle-button-renderer button');
    if (likeButton) {
      actionsContainer = likeButton.closest('#top-level-buttons-computed') || 
                       likeButton.closest('ytd-menu-renderer') ||
                       likeButton.parentElement?.parentElement;
    }
  }

  if (actionsContainer) {
    const btn = document.createElement('button');
    btn.id = 'yshare-btn';
    btn.innerText = 'Share to Friend';
    btn.style.cssText = `
      background-color: #ff0000;
      color: white;
      border: none;
      border-radius: 18px;
      padding: 0 16px;
      margin-left: 8px;
      height: 36px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      white-space: nowrap;
    `;

    btn.addEventListener('click', handleShareClick);

    // Insert as the first item or append
    actionsContainer.prepend(btn);
  }
}

function handleShareClick() {
  // Only work on video pages
  if (!window.location.pathname.includes('/watch')) {
    return;
  }

  const videoUrl = window.location.href.split('&')[0]; // Remove tracking parameters
  // Get title - try multiple selectors
  const titleSelectors = [
    'h1.ytd-video-primary-info-renderer',
    'h1 yt-formatted-string',
    'h1.title',
    '.watch-main-col h1'
  ];
  
  let titleEl = null;
  for (const selector of titleSelectors) {
    titleEl = document.querySelector(selector);
    if (titleEl) break;
  }
  
  const title = titleEl ? titleEl.innerText.trim() : document.title.replace(' - YouTube', '');

  // Simple prompt for comment
  const comment = prompt('Add a comment (optional, max 20 words):');

  // Allow empty comment (user can just press OK)
  let finalComment = '';
  if (comment !== null) {
    // Validate word count
    const words = comment.trim().split(/\s+/).filter(w => w.length > 0);
    finalComment = words.slice(0, 20).join(' ');
  } else {
    // User cancelled
    return;
  }

  chrome.storage.local.get(['roomCode'], (result) => {
    if (!result.roomCode) {
      alert('Please join a room in the YShare extension popup first!');
      return;
    }

    const data = {
      roomCode: result.roomCode,
      videoUrl,
      title,
      comment: finalComment,
      timestamp: new Date().toISOString()
    };

    chrome.runtime.sendMessage({ type: 'SHARE_VIDEO', data }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sharing video:', chrome.runtime.lastError);
        alert('Failed to share video. Please check your connection.');
      } else {
        // Show a brief visual feedback
        const btn = document.getElementById('yshare-btn');
        if (btn) {
          const originalText = btn.innerText;
          btn.innerText = 'Shared!';
          btn.style.backgroundColor = '#4caf50';
          setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = '#ff0000';
          }, 2000);
        }
      }
    });
  });
}

// Observer to handle YouTube navigation (SPA)
const observer = new MutationObserver((mutations) => {
  if (!document.getElementById('yshare-btn')) {
    injectShareButton();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initial try
setTimeout(injectShareButton, 2000);
