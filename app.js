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
const toggleAuth = document.getElementById('toggle-auth');
const googleBtn = document.getElementById('google-login');
const githubBtn = document.getElementById('github-login');
let isSignUp = false;

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

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else window.location.href = '/chat';
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else window.location.href = '/chat';
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
    if (userNameEl) userNameEl.textContent = user.user_metadata?.full_name || user.email;
    if (path === '/login' || path === '/login.html') window.location.href = '/chat';
  } else {
    if (path === '/chat' || path === '/chat.html') window.location.href = '/login';
  }
});

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  });
}

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
        timeSpan.textContent = data.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || 'Just now';
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
}
