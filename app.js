import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Supabase configuration
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Firebase configuration (Keep for Firestore until fully migrated)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Auth Logic
const loginForm = document.getElementById('login-form');
const otpForm = document.getElementById('otp-form');
const toggleAuth = document.getElementById('toggle-auth');
const googleBtn = document.getElementById('google-login');
const githubBtn = document.getElementById('github-login');
let isSignUp = false;
let userEmail = '';

if (toggleAuth) {
  toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUp = !isSignUp;
    const title = document.querySelector('.section-title');
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (isSignUp) {
      title.textContent = "Create Account";
      submitBtn.textContent = "Sign Up";
      toggleAuth.textContent = "Sign in";
    } else {
      title.textContent = "Welcome Back";
      submitBtn.textContent = "Sign In";
      toggleAuth.textContent = "Sign up";
    }
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    userEmail = email;

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0], // Default name
          }
        }
      });
      if (error) {
        alert(error.message);
      } else {
        // Switch to OTP form
        loginForm.style.display = 'none';
        if (otpForm) otpForm.style.display = 'block';
        const toggleContainer = document.getElementById('toggle-auth-container');
        if (toggleContainer) toggleContainer.style.display = 'none';
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else window.location.href = '/index.html';
    }
  });
}

if (otpForm) {
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = document.getElementById('otp-input').value;

    const { data, error } = await supabase.auth.verifyOtp({
      email: userEmail,
      token: token,
      type: 'signup'
    });

    if (error) {
      alert(error.message);
    } else {
      window.location.href = '/index.html';
    }
  });
}

if (googleBtn) {
  googleBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) alert(error.message);
  });
}

if (githubBtn) {
  githubBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' });
    if (error) alert(error.message);
  });
}

// Global state for user
supabase.auth.onAuthStateChange((event, session) => {
  const user = session?.user;
  const userNameEl = document.getElementById('user-name');
  const path = window.location.pathname;

  if (user) {
    const name = user.user_metadata?.full_name || user.email;
    if (userNameEl) userNameEl.textContent = name;

    // Profile page updates
    const pName = document.getElementById('profile-name');
    const pHandle = document.getElementById('profile-handle');
    const pDP = document.getElementById('user-dp');
    if (pName) pName.textContent = name;
    if (pHandle) pHandle.textContent = `@${user.email.split('@')[0]}`;
    if (pDP) pDP.textContent = name.charAt(0).toUpperCase();

    if (path === '/login' || path === '/login.html') window.location.href = '/index.html';
  } else {
    // Protected routes that require authentication
    const protectedRoutes = [
      '/chat', '/chat.html',
      '/profile.html',
      '/settings.html',
      '/index.html',
      '/admin', '/admin.html'
    ];
    if (protectedRoutes.includes(path)) window.location.href = '/login.html';
  }
});

const logoutBtn = document.getElementById('logout-btn');
const logoutBtnSettings = document.getElementById('logout-btn-settings');

async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = '/login.html';
}

if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
if (logoutBtnSettings) logoutBtnSettings.addEventListener('click', handleLogout);

// Chat Logic
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');

if (chatForm && chatMessages) {
  // Listen for messages
  const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
  onSnapshot(q, async (snapshot) => {
    const { data: { user } } = await supabase.auth.getUser();
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        const isMe = data.uid === user?.id;
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isMe ? 'sent' : 'received'}`;

        const textNode = document.createTextNode(data.text);
        msgDiv.appendChild(textNode);

        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        const timeText = data.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || 'Just now';

        if (isMe) {
          timeSpan.innerHTML = `${timeText} <span class="ticks">✓✓</span>`;
        } else {
          timeSpan.textContent = timeText;
        }

        msgDiv.appendChild(timeSpan);
        chatMessages.appendChild(msgDiv);
      }
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!messageInput.value.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Please login to send messages');

    await addDoc(collection(db, "messages"), {
      text: messageInput.value,
      uid: user.id,
      displayName: user.user_metadata?.full_name || user.email,
      photoURL: user.user_metadata?.avatar_url || '',
      createdAt: serverTimestamp()
    });

    messageInput.value = '';
  });

  // Hide bottom nav when chat is active (mobile)
  const mainBottomNav = document.getElementById('main-bottom-nav');
  const chatNav = document.getElementById('chat-nav');

  function hideNavs() {
    if (window.innerWidth <= 768) {
      if (mainBottomNav) mainBottomNav.style.display = 'none';
      if (chatNav) chatNav.style.display = 'none';
    }
  }

  // Toggle between contacts and chat view on mobile
  const contactItems = document.querySelectorAll('.contact-item');
  const sidebar = document.getElementById('sidebar');
  contactItems.forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        if (sidebar) sidebar.classList.remove('open');
        hideNavs();
      }
    });
  });

  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarToggleMobile = document.getElementById('sidebar-toggle-mobile');

  function showSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (mainBottomNav) mainBottomNav.style.display = 'flex';
    if (chatNav) chatNav.style.display = 'flex';
    if (sidebarToggleMobile) sidebarToggleMobile.style.display = 'none';
  }

  if (sidebarToggle) sidebarToggle.addEventListener('click', showSidebar);
  if (sidebarToggleMobile) sidebarToggleMobile.addEventListener('click', showSidebar);

  // Creator Menu Toggle
  const openCreatorBtn = document.getElementById('open-creator');
  const creatorMenu = document.getElementById('creator-menu');
  if (openCreatorBtn && creatorMenu) {
    openCreatorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      creatorMenu.classList.toggle('active');
    });
    document.addEventListener('click', () => {
      creatorMenu.classList.remove('active');
    });
  }
}

// Help Form Logic
const helpForm = document.getElementById('help-form');
if (helpForm) {
  helpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('ticket-title').value;
    const category = document.getElementById('ticket-category').value;
    const desc = document.getElementById('ticket-desc').value;
    const statusEl = document.getElementById('help-status');

    const { data: { user } } = await supabase.auth.getUser();

    // Simulate sending to Telegram Bot and saving to DB
    const ticketData = {
      title,
      category,
      description: desc,
      userId: user?.id || 'anonymous',
      userEmail: user?.email || 'anonymous',
      createdAt: new Date().toISOString()
    };

    console.log('Ticket Submitted:', ticketData);

    if (statusEl) {
      statusEl.textContent = '✓ Ticket submitted successfully! It has been sent to our Telegram support.';
      statusEl.style.color = '#000';
      statusEl.style.display = 'block';
    }

    helpForm.reset();
  });
}

// Report Form Logic
const reportForm = document.getElementById('report-form');
if (reportForm) {
  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const handle = document.getElementById('report-handle').value;
    const reason = document.getElementById('report-reason').value;
    const statusEl = document.getElementById('report-status');

    console.log('Report Submitted:', { handle, reason });

    if (statusEl) {
      statusEl.textContent = '✓ Report submitted. Our team will review it shortly.';
      statusEl.style.color = '#ff4444';
      statusEl.style.display = 'block';
    }

    reportForm.reset();
  });
}

// Username Search and Personal Chat Logic
const userSearchInput = document.getElementById('user-search-input');
const searchOverlay = document.getElementById('search-results-overlay');
const contactList = document.getElementById('contact-list');

if (userSearchInput && searchOverlay) {
  userSearchInput.addEventListener('input', async (e) => {
    const queryStr = e.target.value.trim().toLowerCase();
    if (queryStr.length < 3) {
      searchOverlay.style.display = 'none';
      return;
    }

    // Simulation of searching users in Supabase profiles
    const users = [
      { id: '1', username: 'vinit_raj', full_name: 'Vinit Raj' },
      { id: '2', username: 'jules_ai', full_name: 'Jules AI' },
      { id: '3', username: 'alex_chat', full_name: 'Alex' },
    ].filter(u => u.username.includes(queryStr.replace('@', '')));

    searchOverlay.innerHTML = '';
    if (users.length > 0) {
      users.forEach(u => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `
          <div class="contact-avatar">${u.full_name.charAt(0)}</div>
          <div class="contact-info">
            <div class="contact-name">${u.full_name}</div>
            <div class="contact-last-msg">@${u.username}</div>
          </div>
        `;
        div.onclick = () => {
          startPersonalChat(u);
          searchOverlay.style.display = 'none';
          userSearchInput.value = '';
        };
        searchOverlay.appendChild(div);
      });
      searchOverlay.style.display = 'block';
    } else {
      searchOverlay.style.display = 'none';
    }
  });
}

function startPersonalChat(user) {
  if (!contactList) return;

  // Check if contact already exists
  const existing = Array.from(contactList.querySelectorAll('.contact-name'))
    .find(el => el.textContent === user.full_name);

  if (existing) {
    existing.closest('.contact-item').click();
    return;
  }

  // Add new contact item
  const contactItem = document.createElement('div');
  contactItem.className = 'contact-item';
  contactItem.innerHTML = `
    <div class="contact-avatar">${user.full_name.charAt(0)}</div>
    <div class="contact-info">
      <div class="contact-name">${user.full_name}</div>
      <div class="contact-last-msg">Start chatting with @${user.username}</div>
    </div>
  `;

  contactItem.onclick = () => {
    document.querySelectorAll('.contact-item').forEach(i => i.classList.remove('active'));
    contactItem.classList.add('active');

    const chatTitle = document.querySelector('.chat-main .contact-name');
    if (chatTitle) chatTitle.textContent = user.full_name;

    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      chatMessages.innerHTML = `
        <div class="message received">
          Hi! This is the start of your personal chat with ${user.full_name}.
          <span class="message-time">Just now</span>
        </div>
      `;
    }

    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('open');
      hideNavs();
    }
  };

  contactList.prepend(contactItem);
  contactItem.click();
}

// AI Assistant Logic (Simulation)
const aiForm = document.getElementById('ai-form');
const aiMessages = document.getElementById('ai-messages');
const aiInput = document.getElementById('ai-input');
const aiTyping = document.getElementById('ai-typing');

if (aiForm && aiMessages) {
  aiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = aiInput.value.trim();
    if (!text) return;

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'ai-bubble user';
    userMsg.textContent = text;
    aiMessages.appendChild(userMsg);
    aiInput.value = '';
    aiMessages.scrollTop = aiMessages.scrollHeight;

    // Show typing indicator
    if (aiTyping) aiTyping.style.display = 'block';

    // Simulate OpenRouter API call
    setTimeout(() => {
      if (aiTyping) aiTyping.style.display = 'none';

      const botMsg = document.createElement('div');
      botMsg.className = 'ai-bubble bot';
      botMsg.textContent = `As your Zyno AI, I've processed your request: "${text}". Currently, I'm in simulation mode. In production, I will connect via OpenRouter API.`;
      aiMessages.appendChild(botMsg);
      aiMessages.scrollTop = aiMessages.scrollHeight;
    }, 1500);
  });
}
