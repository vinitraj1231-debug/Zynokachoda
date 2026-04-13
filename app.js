import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
// Replace these with your own Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (isSignUp) {
      createUserWithEmailAndPassword(auth, email, password)
        .then(() => window.location.href = '/chat')
        .catch(err => alert(err.message));
    } else {
      signInWithEmailAndPassword(auth, email, password)
        .then(() => window.location.href = '/chat')
        .catch(err => alert(err.message));
    }
  });
}

if (googleBtn) {
  googleBtn.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(() => window.location.href = '/chat')
      .catch(err => alert(err.message));
  });
}

if (githubBtn) {
  githubBtn.addEventListener('click', () => {
    const provider = new GithubAuthProvider();
    signInWithPopup(auth, provider)
      .then(() => window.location.href = '/chat')
      .catch(err => alert(err.message));
  });
}

// Global state for user
onAuthStateChanged(auth, (user) => {
  const userNameEl = document.getElementById('user-name');
  const path = window.location.pathname;
  if (user) {
    if (userNameEl) userNameEl.textContent = user.displayName || user.email;
    if (path === '/login' || path === '/login.html') window.location.href = '/chat';
  } else {
    if (path === '/chat' || path === '/chat.html') window.location.href = '/login';
  }
});

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '/login');
  });
}

// Chat Logic
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');

if (chatForm && chatMessages) {
  // Listen for messages
  const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        const isMe = data.uid === auth.currentUser?.uid;
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

    const { uid, displayName, photoURL } = auth.currentUser;
    await addDoc(collection(db, "messages"), {
      text: messageInput.value,
      uid,
      displayName,
      photoURL,
      createdAt: serverTimestamp()
    });

    messageInput.value = '';
  });
}
