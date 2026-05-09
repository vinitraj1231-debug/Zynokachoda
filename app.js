import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// IMPORTANT: Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Helper: Safe DOM creation ---
const createEl = (tag, props = {}, children = []) => {
    const el = Object.assign(document.createElement(tag), props);
    children.forEach(child => el.append(child));
    return el;
};

// --- Auth Handling ---
const loginForm = document.getElementById('login-form');
const otpForm = document.getElementById('otp-form');
const toggleAuth = document.getElementById('toggle-auth');
const authTitle = document.getElementById('auth-title');
const toggleText = document.getElementById('toggle-text');
let isSignUp = false, userEmail = '';

if (toggleAuth) {
    toggleAuth.onclick = (e) => {
        e.preventDefault();
        isSignUp = !isSignUp;
        if (authTitle) authTitle.textContent = isSignUp ? "Create Account" : "Welcome Back";
        if (toggleText) toggleText.textContent = isSignUp ? "Already have an account?" : "Don't have an account?";
        toggleAuth.textContent = isSignUp ? "Sign in" : "Sign up";
        if (loginForm) loginForm.querySelector('button').textContent = isSignUp ? "Create Account" : "Continue";
    };
}

if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value, password = document.getElementById('password').value;
        userEmail = email;
        const { error } = isSignUp ? await supabase.auth.signUp({ email, password, options: { data: { full_name: email.split('@')[0] } } }) : await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
        else if (isSignUp) { loginForm.style.display = 'none'; if (otpForm) otpForm.style.display = 'block'; }
        else window.location.href = '/index.html';
    };
}

if (otpForm) {
    otpForm.onsubmit = async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.verifyOtp({ email: userEmail, token: document.getElementById('otp-input').value, type: 'signup' });
        if (error) alert(error.message); else window.location.href = '/index.html';
    };
}

// OAuth Buttons
const googleBtn = document.getElementById('google-login'), githubBtn = document.getElementById('github-login');
if (googleBtn) googleBtn.onclick = () => supabase.auth.signInWithOAuth({ provider: 'google' });
if (githubBtn) githubBtn.onclick = () => supabase.auth.signInWithOAuth({ provider: 'github' });

// --- Chat Logic ---
const chatForm = document.getElementById('chat-form'), chatMessages = document.getElementById('chat-messages'), messageInput = document.getElementById('message-input');
let activeChatId = null;

async function loadMessages() {
    if (!chatMessages) return;
    const { data: { user } } = await supabase.auth.getUser();
    let query = supabase.from('messages').select('*, sender:profiles(full_name, avatar_url)').order('created_at', { ascending: true });
    query = activeChatId ? query.or(`and(sender_id.eq.${activeChatId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${activeChatId})`) : query.is('receiver_id', null);
    const { data, error } = await query;
    if (error) return console.error(error);
    chatMessages.replaceChildren();
    data.forEach(msg => {
        const isMe = msg.sender_id === user?.id;
        const div = createEl('div', { className: `message ${isMe ? 'sent' : 'received'}` }, [
            createEl('div', { style: "font-size: 11px; opacity: 0.6; margin-bottom: 4px;", textContent: isMe ? 'You' : (msg.sender?.full_name || 'User') }),
            createEl('div', { textContent: msg.text }),
            createEl('span', { className: 'message-time', textContent: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
        ]);
        chatMessages.append(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (chatMessages && chatForm) {
    loadMessages();
    supabase.channel('public:messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, loadMessages).subscribe();
    chatForm.onsubmit = async (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (!text) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return window.location.href = '/login.html';
        await supabase.from('messages').insert({ sender_id: user.id, receiver_id: activeChatId, text });
        messageInput.value = '';
    };
}

// --- AI Logic ---
const aiForm = document.getElementById('ai-form'), aiMessages = document.getElementById('ai-messages'), aiInput = document.getElementById('ai-input'), aiTyping = document.getElementById('ai-typing');
if (aiForm && aiMessages) {
    aiForm.onsubmit = (e) => {
        e.preventDefault();
        const text = aiInput.value.trim();
        if (!text) return;
        aiMessages.append(createEl('div', { className: 'message sent', textContent: text }));
        aiInput.value = '';
        if (aiTyping) aiTyping.style.display = 'block';
        setTimeout(() => {
            if (aiTyping) aiTyping.style.display = 'none';
            aiMessages.append(createEl('div', { className: 'message received', textContent: `Zyno AI: I've received your message "${text}". This is a simulation.` }));
            aiMessages.scrollTop = aiMessages.scrollHeight;
        }, 1500);
    };
}

// --- Auth State & Profile ---
supabase.auth.onAuthStateChange(async (event, session) => {
    const user = session?.user, dp = document.getElementById('user-dp'), path = window.location.pathname;
    if (user) {
        if (dp) dp.textContent = (user.user_metadata?.full_name || user.email)[0].toUpperCase();
        const pName = document.getElementById('profile-name'), pHandle = document.getElementById('profile-handle'), dpLarge = document.getElementById('user-dp-large');
        const name = user.user_metadata?.full_name || user.email.split('@')[0];
        if (pName) pName.textContent = name;
        if (pHandle) pHandle.textContent = `@${user.email.split('@')[0]}`;
        if (dpLarge) dpLarge.textContent = name[0].toUpperCase();
        if (path.includes('login.html')) window.location.href = '/index.html';
    } else if (['chat.html', 'profile.html', 'settings.html', 'admin.html', 'ai-chat.html'].some(p => path.includes(p))) {
        window.location.href = '/login.html';
    }
});

const logoutBtn = document.getElementById('logout-btn-settings');
if (logoutBtn) logoutBtn.onclick = async () => { await supabase.auth.signOut(); window.location.href = '/login.html'; };

// --- Sidebar Navigation ---
const globalLounge = document.querySelector('.contact-list .search-item');
if (globalLounge) {
    globalLounge.onclick = () => {
        activeChatId = null;
        document.getElementById('chat-with-name').textContent = "Global Lounge";
        document.getElementById('chat-with-avatar').textContent = "G";
        document.getElementById('chat-with-status').textContent = "Community";
        loadMessages();
    };
}

// --- Search ---
const searchInput = document.getElementById('user-search-input'), searchOverlay = document.getElementById('search-results-overlay');
if (searchInput && searchOverlay) {
    searchInput.oninput = async (e) => {
        const val = e.target.value.trim();
        if (val.length < 2) return searchOverlay.style.display = 'none';
        const { data } = await supabase.from('profiles').select('*').ilike('username', `%${val}%`).limit(5);
        if (data?.length) {
            searchOverlay.replaceChildren();
            searchOverlay.style.display = 'block';
            data.forEach(p => {
                const item = createEl('div', { className: 'search-item' }, [
                    createEl('div', { className: 'profile-box', style: 'width: 32px; height: 32px;', textContent: (p.full_name || 'U')[0] }),
                    createEl('div', { style: 'font-size: 14px; font-weight: 600;', textContent: p.full_name || p.username })
                ]);
                item.onclick = () => { activeChatId = p.id; document.getElementById('chat-with-name').textContent = p.full_name || p.username; document.getElementById('chat-with-avatar').textContent = (p.full_name || p.username)[0]; document.getElementById('chat-with-status').textContent = `@${p.username}`; loadMessages(); searchOverlay.style.display = 'none'; searchInput.value = ''; };
                searchOverlay.append(item);
            });
        }
    };
}
