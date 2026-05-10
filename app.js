import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// IMPORTANT: Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabase;
try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
    console.error("Supabase client failed to initialize:", e);
    // Fallback or mock if needed for UI testing, but normally we need a real client
}

// --- Helper: Safe DOM creation ---
const createEl = (tag, props = {}, children = []) => {
    const el = Object.assign(document.createElement(tag), props);
    children.forEach(child => el.append(child));
    return el;
};

// --- Auth Handling ---
const loginForm = document.getElementById('login-form');
const otpForm = document.getElementById('otp-form');
const backToLogin = document.getElementById('back-to-login');
let userEmail = '';

if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        userEmail = email;

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
            }
        });

        if (error) {
            alert(error.message);
        } else {
            loginForm.style.display = 'none';
            if (document.getElementById('social-auth')) document.getElementById('social-auth').style.display = 'none';
            if (otpForm) otpForm.style.display = 'block';
            if (document.getElementById('auth-subtitle')) document.getElementById('auth-subtitle').textContent = `OTP sent to ${email}`;
        }
    };
}

if (otpForm) {
    otpForm.onsubmit = async (e) => {
        e.preventDefault();
        const token = document.getElementById('otp-input').value;
        const { error } = await supabase.auth.verifyOtp({
            email: userEmail,
            token,
            type: 'email'
        });

        if (error) alert(error.message);
        else window.location.href = '/index.html';
    };
}

if (backToLogin) {
    backToLogin.onclick = (e) => {
        e.preventDefault();
        otpForm.style.display = 'none';
        loginForm.style.display = 'block';
        if (document.getElementById('social-auth')) document.getElementById('social-auth').style.display = 'block';
        if (document.getElementById('auth-subtitle')) document.getElementById('auth-subtitle').textContent = 'Sign in with your email to continue';
    };
}

// OAuth Buttons
const googleBtn = document.getElementById('google-login');
if (googleBtn) googleBtn.onclick = () => supabase.auth.signInWithOAuth({ provider: 'google' });

// --- Chat Logic ---
const chatForm = document.getElementById('chat-form'), chatMessages = document.getElementById('chat-messages'), messageInput = document.getElementById('message-input');
let activeChatId = null;

async function loadMessages() {
    if (!chatMessages) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from('messages').select('*, sender:profiles(full_name, avatar_url, username)').order('created_at', { ascending: true });

    if (activeChatId) {
        query = query.or(`and(sender_id.eq.${activeChatId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${activeChatId})`);
    } else {
        query = query.is('receiver_id', null);
    }

    const { data, error } = await query;
    if (error) return console.error(error);

    chatMessages.replaceChildren();
    data.forEach(msg => {
        const isMe = msg.sender_id === user.id;
        const div = createEl('div', { className: `message ${isMe ? 'sent' : 'received'}` }, [
            createEl('div', { style: "font-size: 11px; opacity: 0.6; margin-bottom: 4px;", textContent: isMe ? 'You' : (msg.sender?.full_name || msg.sender?.username || 'User') }),
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

        await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: activeChatId,
            text
        });
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
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const displayName = profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0];
        const displayUsername = profile?.username || user.email.split('@')[0];

        if (dp) dp.textContent = displayName[0].toUpperCase();
        const pName = document.getElementById('profile-name'), pHandle = document.getElementById('profile-handle'), dpLarge = document.getElementById('user-dp-large');
        if (pName) pName.textContent = displayName;
        if (pHandle) pHandle.textContent = `@${displayUsername}`;
        if (dpLarge) dpLarge.textContent = displayName[0].toUpperCase();
        if (path.includes('login.html')) window.location.href = '/index.html';

        // Force username if it looks like an email or is missing (new users)
        if (!profile?.username && !path.includes('profile.html')) {
             // Optional: Redirect to profile to set username if needed
             // window.location.href = '/profile.html';
        }

        // Profile Editing Logic
        const editBtn = document.getElementById('edit-profile-btn'), editForm = document.getElementById('edit-profile-form'), viewDiv = document.getElementById('profile-view');
        if (editBtn && editForm && viewDiv) {
            editBtn.onclick = () => {
                viewDiv.style.display = 'none';
                editForm.style.display = 'grid';
                document.getElementById('edit-fullname').value = displayName;
                document.getElementById('edit-username').value = displayUsername;
            };
            document.getElementById('cancel-edit-btn').onclick = () => {
                viewDiv.style.display = 'grid';
                editForm.style.display = 'none';
            };
            editForm.onsubmit = async (e) => {
                e.preventDefault();
                const newName = document.getElementById('edit-fullname').value.trim();
                const newUser = document.getElementById('edit-username').value.trim();
                const errEl = document.getElementById('username-error');
                errEl.style.display = 'none';

                const { error } = await supabase.from('profiles').update({
                    full_name: newName,
                    username: newUser,
                    updated_at: new Date().toISOString()
                }).eq('id', user.id);

                if (error) {
                    if (error.code === '23505') errEl.style.display = 'block';
                    else alert(error.message);
                } else {
                    location.reload();
                }
            };
        }
    } else if (['chat.html', 'profile.html', 'settings.html', 'admin.html', 'ai-chat.html'].some(p => path.includes(p))) {
        window.location.href = '/login.html';
    }
});

const logoutBtn = document.getElementById('logout-btn-settings');
if (logoutBtn) logoutBtn.onclick = async () => { await supabase.auth.signOut(); window.location.href = '/login.html'; };

// --- Sidebar Navigation ---
const globalLounge = document.getElementById('global-lounge-item');
if (globalLounge) {
    globalLounge.onclick = () => {
        activeChatId = null;
        document.getElementById('chat-with-name').textContent = "Global Lounge";
        document.getElementById('chat-with-avatar').textContent = "G";
        document.getElementById('chat-with-status').textContent = "Community";
        document.querySelectorAll('.contact-item').forEach(i => i.classList.remove('active'));
        globalLounge.classList.add('active');
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            const chatWindow = document.getElementById('chat-window');
            if (sidebar) sidebar.classList.add('closed');
            if (chatWindow) {
                chatWindow.classList.remove('hidden');
                chatWindow.classList.add('active'); // Added to ensure visibility for playwright
            }
        }
        loadMessages();
    };
}

// Mobile Back Button
const backBtn = document.getElementById('back-to-contacts');
if (backBtn) {
    backBtn.onclick = () => {
        const sidebar = document.getElementById('sidebar');
        const chatWindow = document.getElementById('chat-window');
        if (sidebar) sidebar.classList.remove('closed');
        if (chatWindow) chatWindow.classList.add('hidden');
    };
}

// --- Search & New Chat ---
const searchInput = document.getElementById('user-search-input'), searchOverlay = document.getElementById('search-results-overlay');
if (searchInput && searchOverlay) {
    searchInput.oninput = async (e) => {
        const val = e.target.value.trim();
        if (val.length < 2) {
            searchOverlay.style.display = 'none';
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        const { data } = await supabase.from('profiles')
            .select('*')
            .neq('id', user?.id)
            .or(`username.ilike.%${val}%,full_name.ilike.%${val}%`)
            .limit(5);

        if (data?.length) {
            searchOverlay.replaceChildren();
            searchOverlay.style.display = 'block';
            data.forEach(p => {
                const item = createEl('div', { className: 'contact-item', style: 'padding: 10px 16px; border: none;' }, [
                    createEl('div', { className: 'profile-box', style: 'width: 36px; height: 36px;', textContent: (p.full_name || p.username || 'U')[0] }),
                    createEl('div', { className: 'contact-info' }, [
                        createEl('div', { style: 'font-size: 14px; font-weight: 600;', textContent: p.full_name || p.username }),
                        createEl('div', { style: 'font-size: 11px; color: var(--text-3);', textContent: `@${p.username}` })
                    ])
                ]);
                item.onclick = () => {
                    startPrivateChat(p);
                    searchOverlay.style.display = 'none';
                    searchInput.value = '';
                };
                searchOverlay.append(item);
            });
        } else {
            searchOverlay.style.display = 'none';
        }
    };
}

// Close search overlay when clicking outside
document.addEventListener('click', (e) => {
    if (searchOverlay && !searchInput.contains(e.target) && !searchOverlay.contains(e.target)) {
        searchOverlay.style.display = 'none';
    }
});

function startPrivateChat(profile) {
    activeChatId = profile.id;
    document.getElementById('chat-with-name').textContent = profile.full_name || profile.username;
    document.getElementById('chat-with-avatar').textContent = (profile.full_name || profile.username)[0];
    document.getElementById('chat-with-status').textContent = `@${profile.username}`;

    // Mobile UI handling
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.add('closed');
        document.getElementById('chat-window').classList.remove('hidden');
    }

    // Update sidebar UI
    document.querySelectorAll('.contact-item').forEach(i => i.classList.remove('active'));

    // Check if user already in sidebar, if not add them
    let existing = document.querySelector(`.contact-item[data-id="${profile.id}"]`);
    if (!existing) {
        const contactList = document.getElementById('contact-list');
        const newItem = createEl('div', { className: 'contact-item active' }, [
            createEl('div', { className: 'profile-box', style: 'width: 48px; height: 48px;', textContent: (profile.full_name || profile.username)[0] }),
            createEl('div', { className: 'contact-info' }, [
                createEl('div', { className: 'contact-name-row' }, [
                    createEl('span', { className: 'contact-name', textContent: profile.full_name || profile.username }),
                    createEl('span', { className: 'contact-time', textContent: 'Now' })
                ]),
                createEl('div', { className: 'contact-last-msg', textContent: `@${profile.username}` })
            ])
        ]);
        newItem.setAttribute('data-id', profile.id);
        newItem.onclick = () => {
            activeChatId = profile.id;
            document.getElementById('chat-with-name').textContent = profile.full_name || profile.username;
            document.getElementById('chat-with-avatar').textContent = (profile.full_name || profile.username)[0];
            document.getElementById('chat-with-status').textContent = `@${profile.username}`;
            document.querySelectorAll('.contact-item').forEach(i => i.classList.remove('active'));
            newItem.classList.add('active');
            loadMessages();
        };
        contactList.append(newItem);
    } else {
        existing.classList.add('active');
    }

    loadMessages();
}
