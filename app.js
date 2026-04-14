import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase configuration
const supabaseUrl = 'https://jrjzkpxlpiovhwithxbo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyanprcHhscGlvdmh3aXRoeGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNDUzNDQsImV4cCI6MjA4NDgyMTM0NH0.aRbGjlOVUrRK5Ji-P1W-LJ6HUVYuJeU2pixABEWCYYY';
const supabase = createClient(supabaseUrl, supabaseKey);

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

const ADMIN_EMAIL = 'Kvinit6421@gmail.com';

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else {
        if (data.user?.email === ADMIN_EMAIL) window.location.href = '/admin';
        else window.location.href = '/chat';
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else {
        if (data.user?.email === ADMIN_EMAIL) window.location.href = '/admin';
        else window.location.href = '/chat';
      }
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

    // Admin redirection
    if (user.email === ADMIN_EMAIL) {
      if (path === '/login' || path === '/login.html' || path === '/chat' || path === '/chat.html') {
        window.location.href = '/admin';
      }
    } else {
      if (path === '/login' || path === '/login.html' || path === '/admin' || path === '/admin.html') {
        window.location.href = '/chat';
      }
    }
  } else {
    if (path === '/chat' || path === '/chat.html' || path === '/admin' || path === '/admin.html') {
      window.location.href = '/login';
    }
  }
});

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  });
}

// Admin Panel Logic
const adminMessagesBody = document.getElementById('admin-messages-body');

if (adminMessagesBody) {
  const loadAdminMessages = async () => {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error loading admin messages:', error);
    else {
      adminMessagesBody.innerHTML = '';
      messages.forEach(msg => {
        const tr = document.createElement('tr');

        const tdUser = document.createElement('td');
        const userNameDiv = document.createElement('div');
        userNameDiv.style.fontWeight = '600';
        userNameDiv.textContent = msg.display_name;
        const uidDiv = document.createElement('div');
        uidDiv.style.fontSize = '11px';
        uidDiv.style.color = 'var(--text-3)';
        uidDiv.textContent = msg.uid;
        tdUser.appendChild(userNameDiv);
        tdUser.appendChild(uidDiv);

        const tdText = document.createElement('td');
        tdText.textContent = msg.text;

        const tdTime = document.createElement('td');
        tdTime.style.color = 'var(--text-3)';
        tdTime.style.fontSize = '12px';
        tdTime.textContent = new Date(msg.created_at).toLocaleString();

        const tdActions = document.createElement('td');
        const delBtn = document.createElement('button');
        delBtn.className = 'btn-delete';
        delBtn.textContent = 'Delete';
        delBtn.setAttribute('data-id', msg.id);
        tdActions.appendChild(delBtn);

        tr.appendChild(tdUser);
        tr.appendChild(tdText);
        tr.appendChild(tdTime);
        tr.appendChild(tdActions);

        adminMessagesBody.appendChild(tr);
      });

      document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          if (confirm('Are you sure you want to delete this message?')) {
            const { error } = await supabase.from('messages').delete().eq('id', id);
            if (error) alert('Error deleting message: ' + error.message);
            else loadAdminMessages();
          }
        });
      });
    }
  };

  loadAdminMessages();
}

// Chat Logic
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');

if (chatForm && chatMessages) {
  const renderMessage = (data, user, prepend = false) => {
    const isMe = data.uid === user?.id;
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isMe ? 'sent' : 'received'}`;

    const textNode = document.createTextNode(data.text);
    msgDiv.appendChild(textNode);

    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    const date = data.created_at ? new Date(data.created_at) : new Date();
    timeSpan.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    msgDiv.appendChild(timeSpan);

    if (prepend) {
      chatMessages.prepend(msgDiv);
    } else {
      chatMessages.appendChild(msgDiv);
    }
  };

  // Initial Load
  const loadMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) console.error('Error loading messages:', error);
    else {
      chatMessages.innerHTML = '';
      messages.forEach(msg => renderMessage(msg, user));
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  };

  loadMessages();

  // Listen for real-time updates
  supabase
    .channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
      const { data: { user } } = await supabase.auth.getUser();
      renderMessage(payload.new, user);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    })
    .subscribe();

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Please login to send messages');

    const { error } = await supabase.from('messages').insert([
      {
        text: text,
        uid: user.id,
        display_name: user.user_metadata?.full_name || user.email,
        photo_url: user.user_metadata?.avatar_url || '',
      }
    ]);

    if (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.message);
    } else {
      messageInput.value = '';
    }
  });
}
