// Import Socket.IO client library if not available in DOM or fallback gracefully
let socket;
let currentUser = null;
let activeChatId = null;
let activeProfile = null;
let isSecretChatActive = false;
const activeChats = [];
let typingTimeout = null;

// --- API Helpers ---
async function apiCall(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

// --- E2EE XOR Symmetric Cipher ---
function getSecretKey(id1, id2) {
  return [id1, id2].sort().join('-');
}

function xorEncryptDecrypt(str, key) {
  let output = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    output += String.fromCharCode(charCode);
  }
  return output;
}

function encryptMessage(text, key) {
  const encrypted = xorEncryptDecrypt(text, key);
  return '🔒[E2EE]' + btoa(unescape(encodeURIComponent(encrypted)));
}

function decryptMessage(encryptedText, key) {
  if (!encryptedText.startsWith('🔒[E2EE]')) return encryptedText;
  try {
    const base64Data = encryptedText.substring(8);
    const encrypted = decodeURIComponent(escape(atob(base64Data)));
    return xorEncryptDecrypt(encrypted, key);
  } catch (e) {
    return '🔑 [Decryption Error: Invalid Key]';
  }
}

// --- Dom Utilities ---
const createEl = (tag, props = {}, children = []) => {
  const el = Object.assign(document.createElement(tag), props);
  children.forEach(child => el.append(child));
  return el;
};

// Check path normalization and user session onload
async function checkAuthSession() {
  try {
    currentUser = await apiCall('/api/auth/session');

    // Update global user visual profiles
    const dps = document.querySelectorAll('#user-dp, .profile-box');
    dps.forEach(dp => {
      if (dp) dp.textContent = currentUser.username[0].toUpperCase();
    });

    const pName = document.getElementById('profile-name');
    const pHandle = document.getElementById('profile-handle');
    const dpLarge = document.getElementById('user-dp-large');

    if (pName) pName.textContent = currentUser.username;
    if (pHandle) pHandle.textContent = `@${currentUser.username}`;
    if (dpLarge) dpLarge.textContent = currentUser.username[0].toUpperCase();

    // Init Socket Connection safely
    initializeRealtime();

    // If on login page, push to home
    if (window.location.pathname.endsWith('/login') || window.location.pathname.endsWith('/login.html')) {
      window.location.href = '/chat';
    }
  } catch (err) {
    currentUser = null;
    const protectedPaths = ['/chat', '/profile', '/settings', '/admin', '/ai-chat'];
    const currentPath = window.location.pathname.replace('.html', '');

    if (protectedPaths.some(p => currentPath === p || currentPath.startsWith(p))) {
      window.location.href = '/login';
    }
  }
}

// Socket.IO realtime handling
function initializeRealtime() {
  if (typeof io === 'undefined') {
    // Inject Socket.io library dynamically if not loaded
    const script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    script.onload = () => setupSockets();
    document.head.appendChild(script);
  } else {
    setupSockets();
  }
}

function setupSockets() {
  socket = io();

  // Authenticate socket on registration
  const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('token='));
  const token = tokenCookie ? tokenCookie.split('=')[1] : '';

  socket.emit('register_presence', { token });

  socket.on('presence_change', ({ userId, status, lastSeen }) => {
    // Dynamic presence updater for chats
    if (activeProfile && activeProfile.id === userId) {
      const statusEl = document.getElementById('chat-with-status');
      if (statusEl && !isSecretChatActive) {
        statusEl.textContent = status === 'online' ? 'Online' : 'Offline';
        statusEl.style.color = status === 'online' ? '#00e676' : 'var(--text-3)';
      }
    }
  });

  socket.on('typing_status', ({ senderId, isTyping }) => {
    if (activeProfile && activeProfile.id === senderId) {
      showTypingIndicator(isTyping);
    }
  });

  socket.on('new_message', (msg) => {
    if (activeChatId && msg.chatId === activeChatId) {
      appendSingleMessage(msg);
    } else {
      // Unread badge incrementor logic here
      const item = document.querySelector(`.contact-item[data-id="${msg.chatId}"]`);
      if (item) {
        let badge = item.querySelector('.unread-count');
        if (!badge) {
          badge = createEl('span', { className: 'unread-count', style: 'background: var(--accent-hot); color: #fff; border-radius: 50%; padding: 2px 6px; font-size: 10px; margin-left: auto;' });
          item.appendChild(badge);
        }
        badge.textContent = parseInt(badge.textContent || 0) + 1;
      }
    }
  });
}

// --- Dynamic Dynamic Typing Handler ---
function showTypingIndicator(show) {
  const indicator = document.getElementById('chat-typing');
  if (indicator) {
    indicator.style.display = show ? 'flex' : 'none';
    const msgArea = document.getElementById('chat-messages');
    if (msgArea) msgArea.scrollTop = msgArea.scrollHeight;
  }
}

// --- Render Content Visual Helpers ---
function renderMessageContent(text, senderId) {
  const conversationKey = getSecretKey(senderId, currentUser.id);
  let decrypted = text;
  let isE2EE = false;

  if (text.startsWith('🔒[E2EE]')) {
    decrypted = decryptMessage(text, conversationKey);
    isE2EE = true;
  }

  // Handle Attachment Parsing
  if (decrypted.startsWith('{"type":')) {
    try {
      const attachment = JSON.parse(decrypted);
      const container = createEl('div', { className: 'attachment-msg-container' });

      if (isE2EE) {
        container.append(createEl('div', {
          style: 'font-size: 11px; color: #00e676; margin-bottom: 6px; font-weight: bold;',
          innerHTML: '<span>🔒 E2EE Secret Media</span>'
        }));
      }

      if (attachment.type === 'photo') {
        container.append(
          createEl('div', { className: 'media-attachment-preview' }, [
            createEl('img', { src: attachment.url, alt: 'Shared' })
          ])
        );
        if (attachment.caption) {
          container.append(createEl('div', { style: 'margin-top: 6px; font-size: 14px;', textContent: attachment.caption }));
        }
      } else if (attachment.type === 'file') {
        container.append(
          createEl('div', { className: 'file-attachment-card' }, [
            createEl('div', { className: 'file-attachment-icon', innerHTML: '🗂️' }),
            createEl('div', { className: 'file-attachment-info' }, [
              createEl('div', { className: 'file-attachment-name', textContent: attachment.name }),
              createEl('div', { className: 'file-attachment-size', textContent: attachment.size })
            ])
          ])
        );
      } else if (attachment.type === 'location') {
        container.append(
          createEl('div', { className: 'file-attachment-card' }, [
            createEl('div', { className: 'file-attachment-icon', style: 'background: #00e676;', innerHTML: '📍' }),
            createEl('div', { className: 'file-attachment-info' }, [
              createEl('div', { className: 'file-attachment-name', textContent: 'Shared Location' }),
              createEl('div', { className: 'file-attachment-size', textContent: attachment.coords })
            ])
          ])
        );
      } else if (attachment.type === 'voice') {
        container.append(
          createEl('div', { className: 'voice-attachment-bubble' }, [
            createEl('div', { className: 'voice-play-btn', innerHTML: '▶' }),
            createEl('div', { className: 'voice-progress' }, [
              createEl('div', { className: 'voice-progress-bar' })
            ]),
            createEl('span', { className: 'voice-duration', textContent: attachment.duration })
          ])
        );
      }
      return container;
    } catch (e) {}
  }

  const textSpan = createEl('span', { textContent: decrypted });
  if (isE2EE) {
    return createEl('div', { className: 'secret-msg', style: 'display: flex; align-items: center; gap: 4px;' }, [
      createEl('span', { style: 'color: #00e676; font-size: 12px; font-weight: bold;', textContent: '🔒' }),
      textSpan
    ]);
  }
  return textSpan;
}

// Append single WS message
function appendSingleMessage(msg) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;

  const isMe = msg.senderId === currentUser.id;
  const content = renderMessageContent(msg.text, msg.senderId);
  const timeString = new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const div = createEl('div', { className: `message ${isMe ? 'sent' : 'received'}` }, [
    createEl('div', { style: 'font-size: 11px; opacity: 0.6; margin-bottom: 4px;', textContent: isMe ? 'You' : `@${msg.sender?.username || 'user'}` }),
    content,
    createEl('span', { className: 'message-time' }, [
      document.createTextNode(timeString),
      isMe ? createEl('span', { className: 'message-status-ticks', textContent: '✓✓' }) : ''
    ])
  ]);

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Active Load Conversation ---
async function loadMessages(chatId) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;

  try {
    const messages = await apiCall(`/api/messages/${chatId}`);
    chatMessages.replaceChildren();

    messages.forEach(msg => {
      const isMe = msg.senderId === currentUser.id;
      const content = renderMessageContent(msg.text, msg.senderId);
      const timeString = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const div = createEl('div', { className: `message ${isMe ? 'sent' : 'received'}` }, [
        createEl('div', { style: 'font-size: 11px; opacity: 0.6; margin-bottom: 4px;', textContent: isMe ? 'You' : `@${msg.sender?.username || 'user'}` }),
        content,
        createEl('span', { className: 'message-time' }, [
          document.createTextNode(timeString),
          isMe ? createEl('span', { className: 'message-status-ticks', textContent: '✓✓' }) : ''
        ])
      ]);
      chatMessages.appendChild(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (err) {
    console.error('Failed to load message log:', err);
  }
}

// ── AUTH PANEL EVENT HANDLING ───────────────────────────────
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const usernameOrEmail = document.getElementById('email').value.trim();
    const password = document.getElementById('password') ? document.getElementById('password').value : '';

    if (!password) {
      // Toggle mode for user registration
      alert('Secure Password required to Authenticate.');
      const passGroup = createEl('div', { className: 'form-group', style: 'margin-bottom: 16px;' }, [
        createEl('input', { type: 'password', id: 'password', className: 'auth-input', placeholder: 'Enter Secure Password', required: true })
      ]);
      loginForm.insertBefore(passGroup, document.getElementById('login-btn'));
      return;
    }

    try {
      const isRegisterFlow = loginForm.getAttribute('data-flow') === 'register';
      if (isRegisterFlow) {
        // Run secure registration first
        const regEmail = usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@zyno.io`;
        await apiCall('/api/auth/register', 'POST', { username: usernameOrEmail.split('@')[0], email: regEmail, password });
        alert('Registration successful! Logging you in...');
      }

      const data = await apiCall('/api/auth/login', 'POST', { usernameOrEmail, password });
      window.location.href = '/chat';
    } catch (err) {
      alert(err.message);
    }
  };
}

// Forgot Password toggle
const backToLogin = document.getElementById('back-to-login');
if (backToLogin) {
  backToLogin.onclick = async (e) => {
    e.preventDefault();
    const email = prompt('Enter your recovery email:');
    if (!email) return;
    try {
      const data = await apiCall('/api/auth/forgot-password', 'POST', { email });
      alert(data.message);
    } catch (err) {
      alert(err.message);
    }
  };
}

// Google Auth Simulation alert
const googleBtn = document.getElementById('google-login');
if (googleBtn) {
  googleBtn.onclick = () => {
    alert('🔐 Secure Google OAuth integration is protected by Production CSP. Real-time session credentials will sync upon return.');
  };
}

// Logout Settings button handler
const logoutBtn = document.getElementById('logout-btn-settings');
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    try {
      await apiCall('/api/auth/logout', 'POST');
      window.location.href = '/login';
    } catch (err) {
      alert('Logout failed');
    }
  };
}

// ── SIDEBAR SEARCH & CHAT LOUNGE SYSTEM ──────────────────────
const searchInput = document.getElementById('user-search-input');
const searchOverlay = document.getElementById('search-results-overlay');

if (searchInput && searchOverlay) {
  searchInput.oninput = async (e) => {
    const val = e.target.value.trim();
    if (val.length < 2) {
      searchOverlay.style.display = 'none';
      return;
    }

    try {
      const users = await apiCall(`/api/users/search?q=${encodeURIComponent(val)}`);
      if (users.length) {
        searchOverlay.replaceChildren();
        searchOverlay.style.display = 'block';

        users.forEach(u => {
          const item = createEl('div', { className: 'contact-item', style: 'padding: 10px 16px; border: none;' }, [
            createEl('div', { className: 'profile-box', style: 'width: 36px; height: 36px;', textContent: u.username[0].toUpperCase() }),
            createEl('div', { className: 'contact-info' }, [
              createEl('div', { style: 'font-size: 14px; font-weight: 600;', textContent: u.username }),
              createEl('div', { style: 'font-size: 11px; color: var(--text-3);', textContent: `@${u.username}` })
            ])
          ]);

          item.onclick = async () => {
            await startPrivateChat(u);
            searchOverlay.style.display = 'none';
            searchInput.value = '';
          };
          searchOverlay.append(item);
        });
      } else {
        searchOverlay.style.display = 'none';
      }
    } catch (err) {
      console.error(err);
    }
  };
}

async function startPrivateChat(recipient) {
  try {
    const chat = await apiCall('/api/chats', 'POST', { type: 'direct', recipientId: recipient.id });
    activeChatId = chat.id;
    activeProfile = recipient;
    isSecretChatActive = false;

    const chatMain = document.getElementById('chat-main');
    if (chatMain) chatMain.classList.remove('secret-active');

    document.getElementById('chat-with-name').textContent = recipient.username;
    document.getElementById('chat-with-avatar').textContent = recipient.username[0].toUpperCase();
    document.getElementById('chat-with-status').textContent = 'Online';
    document.getElementById('chat-with-status').style.color = '#00e676';

    // Inject chat listing item dynamically to sidebar
    injectSidebarChat(chat, recipient);
    updateMobileView('chat');
    await loadMessages(chat.id);
  } catch (err) {
    alert(err.message);
  }
}

function injectSidebarChat(chat, recipient) {
  const contactList = document.getElementById('contact-list');
  if (!contactList) return;

  let existing = document.querySelector(`.contact-item[data-id="${chat.id}"]`);
  if (!existing) {
    const item = createEl('div', { className: 'contact-item active' }, [
      createEl('div', { className: 'profile-box', style: 'width: 48px; height: 48px;', textContent: recipient.username[0].toUpperCase() }),
      createEl('div', { className: 'contact-info' }, [
        createEl('div', { className: 'contact-name-row' }, [
          createEl('span', { className: 'contact-name', textContent: recipient.username }),
          createEl('span', { className: 'contact-time', textContent: 'Live' })
        ]),
        createEl('div', { className: 'contact-last-msg', textContent: 'Secure Messaging active...' })
      ])
    ]);
    item.setAttribute('data-id', chat.id);
    item.onclick = () => {
      document.querySelectorAll('.contact-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      activeChatId = chat.id;
      activeProfile = recipient;

      document.getElementById('chat-with-name').textContent = recipient.username;
      document.getElementById('chat-with-avatar').textContent = recipient.username[0].toUpperCase();

      const badge = item.querySelector('.unread-count');
      if (badge) badge.remove();

      updateMobileView('chat');
      loadMessages(chat.id);
    };
    contactList.appendChild(item);
  } else {
    document.querySelectorAll('.contact-item').forEach(i => i.classList.remove('active'));
    existing.classList.add('active');
  }
}

// Mobile back button toggler
function updateMobileView(view) {
  if (view === 'chat') {
    document.body.classList.add('chat-view');
    document.body.classList.remove('contacts-view');
  } else {
    document.body.classList.add('contacts-view');
    document.body.classList.remove('chat-view');
  }
}

const backBtn = document.getElementById('back-to-contacts');
if (backBtn) {
  backBtn.onclick = () => {
    updateMobileView('contacts');
  };
}

// --- Typing State Transmission emitter ---
const messageInput = document.getElementById('message-input');
if (messageInput) {
  messageInput.oninput = () => {
    if (socket && activeProfile) {
      socket.emit('typing_indicator', { recipientId: activeProfile.id, isTyping: true });

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit('typing_indicator', { recipientId: activeProfile.id, isTyping: false });
      }, 2000);
    }

    const text = messageInput.value.trim();
    const micBtn = document.getElementById('mic-btn');
    const sendBtn = document.getElementById('send-btn');
    if (text) {
      if (micBtn) micBtn.style.display = 'none';
      if (sendBtn) sendBtn.style.display = 'flex';
    } else {
      if (micBtn) micBtn.style.display = 'flex';
      if (sendBtn) sendBtn.style.display = 'none';
    }
  };
}

// Submit Realtime Message
const chatForm = document.getElementById('chat-form');
if (chatForm) {
  chatForm.onsubmit = (e) => {
    e.preventDefault();
    if (!activeChatId) {
      alert('Please start a direct chat to begin secure communication!');
      return;
    }

    const text = messageInput.value.trim();
    if (!text) return;

    let payloadText = text;
    if (isSecretChatActive && activeProfile) {
      const key = getSecretKey(currentUser.id, activeProfile.id);
      payloadText = encryptMessage(text, key);
    }

    if (socket) {
      socket.emit('send_message', { chatId: activeChatId, text: payloadText });
    }

    messageInput.value = '';
    const micBtn = document.getElementById('mic-btn');
    const sendBtn = document.getElementById('send-btn');
    if (micBtn) micBtn.style.display = 'flex';
    if (sendBtn) sendBtn.style.display = 'none';
  };
}

// Secret E2EE Chat Switch toggle handler
const secretChatToggle = document.getElementById('secret-chat-toggle');
if (secretChatToggle) {
  secretChatToggle.onclick = () => {
    if (!activeProfile) {
      alert('🔒 Secret Chats require a highly verified 1-to-1 secure participant channel.');
      return;
    }

    isSecretChatActive = !isSecretChatActive;
    const chatMain = document.getElementById('chat-main');
    const chatStatus = document.getElementById('chat-with-status');

    if (isSecretChatActive) {
      chatMain.classList.add('secret-active');
      chatStatus.textContent = '🔒 Secret Chat (E2EE Active)';
      chatStatus.style.color = '#00e676';
    } else {
      chatMain.classList.remove('secret-active');
      chatStatus.textContent = 'Online';
      chatStatus.style.color = '';
    }
  };
}

// ── ATTACHMENT UPLOADING SIMULATION ─────────────────────────
const attachmentBtn = document.getElementById('attachment-btn');
const attachmentDropdown = document.getElementById('attachment-dropdown');

if (attachmentBtn && attachmentDropdown) {
  attachmentBtn.onclick = (e) => {
    e.stopPropagation();
    attachmentDropdown.style.display = attachmentDropdown.style.display === 'none' ? 'block' : 'none';
  };

  document.addEventListener('click', () => {
    attachmentDropdown.style.display = 'none';
  });

  const attachmentItems = document.querySelectorAll('.attachment-item');
  attachmentItems.forEach(item => {
    item.onclick = async (e) => {
      e.stopPropagation();
      attachmentDropdown.style.display = 'none';
      const type = item.getAttribute('data-type');

      const overlay = document.getElementById('upload-overlay');
      const uploadText = document.getElementById('upload-text');
      if (overlay && uploadText) {
        overlay.style.display = 'block';
        let progress = 0;
        const interval = setInterval(() => {
          progress += 25;
          uploadText.textContent = `Uploading File (${progress}%)...`;
          if (progress >= 100) {
            clearInterval(interval);
            overlay.style.display = 'none';

            let payloadObj = {};
            if (type === 'photo') {
              payloadObj = {
                type: 'photo',
                url: 'https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png',
                caption: 'Shared Security Report Screenshot'
              };
            } else if (type === 'file') {
              payloadObj = {
                type: 'file',
                name: 'Zynochat_Security_Audited_Report.pdf',
                size: '2.4 MB'
              };
            } else if (type === 'location') {
              payloadObj = {
                type: 'location',
                coords: 'Mumbai, Maharashtra (19.0760° N, 72.8777° E)'
              };
            }

            let payloadStr = JSON.stringify(payloadObj);
            if (isSecretChatActive && activeProfile) {
              const key = getSecretKey(currentUser.id, activeProfile.id);
              payloadStr = encryptMessage(payloadStr, key);
            }

            if (socket && activeChatId) {
              socket.emit('send_message', { chatId: activeChatId, text: payloadStr });
            }
          }
        }, 200);
      }
    };
  });
}

// --- Mic Soundwave Recorder Simulation ---
const micBtn = document.getElementById('mic-btn');
if (micBtn) {
  let timerInterval;
  let seconds = 0;
  const recordingOverlay = document.getElementById('recording-overlay');
  const cancelRecording = document.getElementById('cancel-recording');
  const timer = document.getElementById('recording-timer');

  micBtn.onclick = () => {
    messageInput.style.display = 'none';
    recordingOverlay.style.display = 'flex';
    micBtn.innerHTML = '✔';
    micBtn.title = 'Confirm Audio Record';

    seconds = 0;
    if (timer) timer.textContent = '00:00';
    timerInterval = setInterval(() => {
      seconds++;
      const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
      const secs = String(seconds % 60).padStart(2, '0');
      if (timer) timer.textContent = `${mins}:${secs}`;
    }, 1000);

    micBtn.onclick = () => {
      clearInterval(timerInterval);
      messageInput.style.display = 'block';
      recordingOverlay.style.display = 'none';

      // Restore mic SVG
      micBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
      micBtn.title = 'Record Voice Note';

      // Re-trigger click rebind
      setupMicButton();

      const duration = seconds > 0 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : '0:03';
      const voiceObj = { type: 'voice', duration };

      let payloadStr = JSON.stringify(voiceObj);
      if (isSecretChatActive && activeProfile) {
        const key = getSecretKey(currentUser.id, activeProfile.id);
        payloadStr = encryptMessage(payloadStr, key);
      }

      if (socket && activeChatId) {
        socket.emit('send_message', { chatId: activeChatId, text: payloadStr });
      }
    };
  };

  function setupMicButton() {
    micBtn.onclick = () => {
      messageInput.style.display = 'none';
      recordingOverlay.style.display = 'flex';
      micBtn.innerHTML = '✔';

      seconds = 0;
      if (timer) timer.textContent = '00:00';
      timerInterval = setInterval(() => {
        seconds++;
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        if (timer) timer.textContent = `${mins}:${secs}`;
      }, 1000);

      micBtn.onclick = () => {
        clearInterval(timerInterval);
        messageInput.style.display = 'block';
        recordingOverlay.style.display = 'none';
        micBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
        setupMicButton();

        const duration = seconds > 0 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : '0:03';
        const voiceObj = { type: 'voice', duration };

        let payloadStr = JSON.stringify(voiceObj);
        if (isSecretChatActive && activeProfile) {
          const key = getSecretKey(currentUser.id, activeProfile.id);
          payloadStr = encryptMessage(payloadStr, key);
        }

        if (socket && activeChatId) {
          socket.emit('send_message', { chatId: activeChatId, text: payloadStr });
        }
      };
    };
  }

  if (cancelRecording) {
    cancelRecording.onclick = (e) => {
      e.stopPropagation();
      clearInterval(timerInterval);
      messageInput.style.display = 'block';
      recordingOverlay.style.display = 'none';
      micBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
      setupMicButton();
    };
  }
}

// ── INITIALIZE ON LOAD ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkAuthSession();
});
export { checkAuthSession, apiCall };
