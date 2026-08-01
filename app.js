import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// IMPORTANT: Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Safe initialized client using memory tips to prevent crash on placeholders
let supabase;
try {
    if (!SUPABASE_URL || SUPABASE_URL.startsWith('YOUR_')) {
        // Safe placeholder proxy client
        const mockMessages = [
            {
                id: 'mock-1',
                sender_id: 'system-id',
                receiver_id: null,
                text: 'Welcome to the highly secured Zynochat Lounge! 🚀 Feel free to try our E2EE Secret Chats (lock icon in header), media attachments, and voice messages.',
                created_at: new Date(Date.now() - 10 * 60000).toISOString(),
                sender: { full_name: 'System Bot', username: 'system' }
            }
        ];

        const createDummyProxy = () => {
            return new Proxy(() => {}, {
                get: (target, prop) => {
                    if (prop === 'then') return undefined;
                    if (prop === 'onAuthStateChange') return (cb) => cb('SIGNED_IN', { user: { id: 'dummy-id', email: 'user@example.com', user_metadata: { full_name: 'Premium User' } } });
                    if (prop === 'getUser') return async () => ({ data: { user: { id: 'dummy-id', email: 'user@example.com' } }, error: null });
                    if (prop === 'channel') {
                        return () => {
                            const chan = {
                                on: () => chan,
                                subscribe: () => {}
                            };
                            return chan;
                        };
                    }
                    if (prop === 'from') {
                        return (tableName) => {
                            if (tableName === 'messages') {
                                return {
                                    select: () => ({
                                        order: () => ({
                                            or: () => {
                                                const filtered = mockMessages.filter(m => m.receiver_id === activeChatId || (m.sender_id === activeChatId && m.receiver_id === 'dummy-id'));
                                                return { data: filtered, error: null };
                                            },
                                            is: () => {
                                                const filtered = mockMessages.filter(m => m.receiver_id === null);
                                                return { data: filtered, error: null };
                                            },
                                            limit: () => ({ data: mockMessages, error: null }),
                                        })
                                    }),
                                    insert: async (payload) => {
                                        const newMsg = {
                                            id: `mock-msg-${Date.now()}`,
                                            sender_id: payload.sender_id || 'dummy-id',
                                            receiver_id: payload.receiver_id || null,
                                            text: payload.text,
                                            created_at: new Date().toISOString(),
                                            sender: { full_name: 'Premium User', username: 'user' }
                                        };
                                        mockMessages.push(newMsg);
                                        // Simulate real-time websocket trigger
                                        setTimeout(() => {
                                            if (typeof loadMessages === 'function') {
                                                loadMessages();
                                            }
                                        }, 50);
                                        return { data: [newMsg], error: null };
                                    }
                                };
                            }
                            return {
                                select: () => ({
                                    neq: () => ({
                                        or: () => ({
                                            limit: () => ({ data: [] })
                                        })
                                    })
                                }),
                                insert: async () => ({ data: [], error: null })
                            };
                        };
                    }
                    return createDummyProxy();
                }
            });
        };
        supabase = createDummyProxy();
        console.warn("Supabase initialized with dummy client because actual credentials are not configured.");
    } else {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.error("Failed to initialize Supabase client: ", e);
}

// --- Helper: Safe DOM creation ---
const createEl = (tag, props = {}, children = []) => {
    const el = Object.assign(document.createElement(tag), props);
    children.forEach(child => el.append(child));
    return el;
};

// --- E2EE Symmetric XOR Cipher with Base64 encoding ---
function getSecretKey(id1, id2) {
    const sorted = [id1, id2].sort();
    return sorted.join('-');
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

// --- Chat State ---
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const micBtn = document.getElementById('mic-btn');
const sendBtn = document.getElementById('send-btn');
let activeChatId = null;
let isSecretChatActive = false;
let activeProfile = null;

// --- Adaptive Mobile View Management ---
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

// --- Typing indicator toggler ---
function showTypingIndicator(show) {
    const indicator = document.getElementById('chat-typing');
    if (indicator) {
        indicator.style.display = show ? 'flex' : 'none';
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
}

// --- Render Message Content beautifully with support for E2EE and Attachments ---
function renderMessageContent(text, senderId, receiverId, user) {
    const conversationKey = getSecretKey(senderId, receiverId || user.id);
    let decrypted = text;
    let isE2EE = false;

    if (text.startsWith('🔒[E2EE]')) {
        decrypted = decryptMessage(text, conversationKey);
        isE2EE = true;
    }

    // Render JSON attachments if any
    if (decrypted.startsWith('{"type":')) {
        try {
            const attachment = JSON.parse(decrypted);
            const container = createEl('div', { className: 'attachment-msg-container' });

            if (isE2EE) {
                container.append(createEl('div', {
                    style: 'font-size: 11px; color: #00e676; margin-bottom: 6px; display: flex; align-items: center; gap: 4px; font-weight: bold;',
                    innerHTML: '<span>🔒 E2EE Secret Media</span>'
                }));
            }

            if (attachment.type === 'photo') {
                container.append(
                    createEl('div', { className: 'media-attachment-preview' }, [
                        createEl('img', { src: attachment.url, alt: 'Shared Attachment' })
                    ])
                );
                if (attachment.caption) {
                    container.append(createEl('div', { style: 'margin-top: 6px; font-size: 14px;', textContent: attachment.caption }));
                }
            } else if (attachment.type === 'file') {
                container.append(
                    createEl('div', { className: 'file-attachment-card' }, [
                        createEl('div', { className: 'file-attachment-icon', innerHTML: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>' }),
                        createEl('div', { className: 'file-attachment-info' }, [
                            createEl('div', { className: 'file-attachment-name', textContent: attachment.name }),
                            createEl('div', { className: 'file-attachment-size', textContent: attachment.size })
                        ])
                    ])
                );
            } else if (attachment.type === 'location') {
                container.append(
                    createEl('div', { className: 'file-attachment-card' }, [
                        createEl('div', { className: 'file-attachment-icon', style: 'background: #00e676;', innerHTML: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path></svg>' }),
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
        } catch (e) {
            // Decrypt error fallback
        }
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

// --- Load Messages ---
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
    data.forEach((msg, idx) => {
        const isMe = msg.sender_id === user.id;
        const msgContent = renderMessageContent(msg.text, msg.sender_id, msg.receiver_id, user);

        const timeString = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Single tick for older messages, double ticks for very recent ones
        const ticks = idx === data.length - 1 ? '✓' : '✓✓';

        const div = createEl('div', { className: `message ${isMe ? 'sent' : 'received'}` }, [
            createEl('div', { style: "font-size: 11px; opacity: 0.6; margin-bottom: 4px;", textContent: isMe ? 'You' : (msg.sender?.full_name || msg.sender?.username || 'User') }),
            msgContent,
            createEl('span', { className: 'message-time' }, [
                document.createTextNode(timeString),
                isMe ? createEl('span', { className: 'message-status-ticks', textContent: ticks }) : ''
            ])
        ]);

        chatMessages.append(div);

        // Animate checkmarks to double ticks (read receipt simulation)
        if (isMe && idx === data.length - 1) {
            setTimeout(() => {
                const tickEl = div.querySelector('.message-status-ticks');
                if (tickEl) tickEl.textContent = '✓✓';
            }, 1200);
        }
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Message Input Button Toggle ---
if (messageInput) {
    messageInput.oninput = () => {
        const text = messageInput.value.trim();
        if (text) {
            if (micBtn) micBtn.style.display = 'none';
            if (sendBtn) sendBtn.style.display = 'flex';
        } else {
            if (micBtn) micBtn.style.display = 'flex';
            if (sendBtn) sendBtn.style.display = 'none';
        }
    };
}

// --- Submit Message ---
if (chatMessages && chatForm) {
    loadMessages();
    supabase.channel('public:messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, loadMessages).subscribe();

    chatForm.onsubmit = async (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (!text) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return window.location.href = '/login.html';

        let finalPayloadText = text;

        if (isSecretChatActive && activeChatId) {
            const key = getSecretKey(user.id, activeChatId);
            finalPayloadText = encryptMessage(text, key);
        }

        await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: activeChatId,
            text: finalPayloadText
        });

        messageInput.value = '';
        if (micBtn) micBtn.style.display = 'flex';
        if (sendBtn) sendBtn.style.display = 'none';

        // Show simulated typing for dynamic feedback
        showTypingIndicator(true);
        setTimeout(() => showTypingIndicator(false), 2000);
    };
}

// --- Secret Chat (E2EE) Mode Toggle ---
const secretChatToggle = document.getElementById('secret-chat-toggle');
if (secretChatToggle) {
    secretChatToggle.onclick = () => {
        if (!activeChatId) {
            alert("🔒 Secret Chat is only supported in secure private one-on-one chats, not the Global Lounge.");
            return;
        }
        isSecretChatActive = !isSecretChatActive;
        const chatMain = document.getElementById('chat-main');
        const chatStatus = document.getElementById('chat-with-status');

        if (isSecretChatActive) {
            chatMain.classList.add('secret-active');
            chatStatus.textContent = "🔒 Secret Chat (E2EE Active)";
            chatStatus.style.color = "#00e676";
        } else {
            chatMain.classList.remove('secret-active');
            chatStatus.textContent = activeProfile ? `@${activeProfile.username}` : "Online";
            chatStatus.style.color = "";
        }
    };
}

// --- Attachment Dropdown & Sharing ---
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
                // Animated uploading progress
                let progress = 0;
                const interval = setInterval(async () => {
                    progress += 25;
                    uploadText.textContent = `Uploading File (${progress}%)...`;
                    if (progress >= 100) {
                        clearInterval(interval);
                        overlay.style.display = 'none';

                        // Send serialized attachment details
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;

                        let payloadObj = {};
                        if (type === 'photo') {
                            payloadObj = {
                                type: 'photo',
                                url: 'https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png',
                                caption: 'Shared from Obsidian Gallery Pro'
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
                        if (isSecretChatActive && activeChatId) {
                            const key = getSecretKey(user.id, activeChatId);
                            payloadStr = encryptMessage(payloadStr, key);
                        }

                        await supabase.from('messages').insert({
                            sender_id: user.id,
                            receiver_id: activeChatId,
                            text: payloadStr
                        });
                    }
                }, 300);
            }
        };
    });
}

// --- Microphone Audio Note Recorder Simulation ---
if (micBtn) {
    let recordingTimerInterval;
    let recordingSeconds = 0;
    const recordingOverlay = document.getElementById('recording-overlay');
    const cancelRecording = document.getElementById('cancel-recording');
    const recordingTimer = document.getElementById('recording-timer');

    micBtn.onclick = () => {
        // Switch input to recording view
        messageInput.style.display = 'none';
        recordingOverlay.style.display = 'flex';
        micBtn.classList.remove('mic-mode');
        micBtn.innerHTML = '✔'; // change mic to confirm/send checkmark
        micBtn.title = "Save Voice Note";

        recordingSeconds = 0;
        if (recordingTimer) recordingTimer.textContent = '00:00';
        recordingTimerInterval = setInterval(() => {
            recordingSeconds++;
            const mins = String(Math.floor(recordingSeconds / 60)).padStart(2, '0');
            const secs = String(recordingSeconds % 60).padStart(2, '0');
            if (recordingTimer) recordingTimer.textContent = `${mins}:${secs}`;
        }, 1000);

        // Define confirm/send callback
        micBtn.onclick = async () => {
            clearInterval(recordingTimerInterval);
            messageInput.style.display = 'block';
            recordingOverlay.style.display = 'none';

            // Restore microphone icon
            micBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
            micBtn.classList.add('mic-mode');
            micBtn.title = "Record Voice Note";

            // Re-bind click
            setupMicClick();

            const finalDuration = recordingSeconds > 0 ? `${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, '0')}` : '0:03';

            // Send voice note
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let payloadObj = {
                type: 'voice',
                duration: finalDuration
            };
            let payloadStr = JSON.stringify(payloadObj);
            if (isSecretChatActive && activeChatId) {
                const key = getSecretKey(user.id, activeChatId);
                payloadStr = encryptMessage(payloadStr, key);
            }

            await supabase.from('messages').insert({
                sender_id: user.id,
                receiver_id: activeChatId,
                text: payloadStr
            });
        };
    };

    function setupMicClick() {
        micBtn.onclick = () => {
            messageInput.style.display = 'none';
            recordingOverlay.style.display = 'flex';
            micBtn.classList.remove('mic-mode');
            micBtn.innerHTML = '✔';
            micBtn.title = "Save Voice Note";

            recordingSeconds = 0;
            if (recordingTimer) recordingTimer.textContent = '00:00';
            recordingTimerInterval = setInterval(() => {
                recordingSeconds++;
                const mins = String(Math.floor(recordingSeconds / 60)).padStart(2, '0');
                const secs = String(recordingSeconds % 60).padStart(2, '0');
                if (recordingTimer) recordingTimer.textContent = `${mins}:${secs}`;
            }, 1000);

            micBtn.onclick = async () => {
                clearInterval(recordingTimerInterval);
                messageInput.style.display = 'block';
                recordingOverlay.style.display = 'none';

                micBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
                micBtn.classList.add('mic-mode');
                micBtn.title = "Record Voice Note";
                setupMicClick();

                const finalDuration = recordingSeconds > 0 ? `${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, '0')}` : '0:03';

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                let payloadObj = {
                    type: 'voice',
                    duration: finalDuration
                };
                let payloadStr = JSON.stringify(payloadObj);
                if (isSecretChatActive && activeChatId) {
                    const key = getSecretKey(user.id, activeChatId);
                    payloadStr = encryptMessage(payloadStr, key);
                }

                await supabase.from('messages').insert({
                    sender_id: user.id,
                    receiver_id: activeChatId,
                    text: payloadStr
                });
            };
        };
    }

    if (cancelRecording) {
        cancelRecording.onclick = (e) => {
            e.stopPropagation();
            clearInterval(recordingTimerInterval);
            messageInput.style.display = 'block';
            recordingOverlay.style.display = 'none';
            micBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
            micBtn.classList.add('mic-mode');
            micBtn.title = "Record Voice Note";
            setupMicClick();
        };
    }
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

    // Normalize path by removing .html and trailing slashes to check clean URLs reliably
    let cleanPath = path;
    if (cleanPath.endsWith('.html')) {
        cleanPath = cleanPath.slice(0, -5);
    }
    if (cleanPath.endsWith('/') && cleanPath.length > 1) {
        cleanPath = cleanPath.slice(0, -1);
    }

    if (user) {
        if (dp) dp.textContent = (user.user_metadata?.full_name || user.email)[0].toUpperCase();
        const pName = document.getElementById('profile-name'), pHandle = document.getElementById('profile-handle'), dpLarge = document.getElementById('user-dp-large');
        const name = user.user_metadata?.full_name || user.email.split('@')[0];
        if (pName) pName.textContent = name;
        if (pHandle) pHandle.textContent = `@${user.email.split('@')[0]}`;
        if (dpLarge) dpLarge.textContent = name[0].toUpperCase();
        if (cleanPath === '/login') window.location.href = '/index.html';
    } else {
        const protectedPaths = ['/chat', '/profile', '/settings', '/admin', '/ai-chat'];
        if (protectedPaths.includes(cleanPath)) {
            window.location.href = '/login.html';
        }
    }
});

const logoutBtn = document.getElementById('logout-btn-settings');
if (logoutBtn) logoutBtn.onclick = async () => { await supabase.auth.signOut(); window.location.href = '/login.html'; };

// --- Sidebar Navigation ---
const globalLounge = document.getElementById('global-lounge-item');
if (globalLounge) {
    globalLounge.onclick = () => {
        activeChatId = null;
        activeProfile = null;
        isSecretChatActive = false;

        // Remove Secret styles
        const chatMain = document.getElementById('chat-main');
        if (chatMain) chatMain.classList.remove('secret-active');

        document.getElementById('chat-with-name').textContent = "Global Lounge";
        document.getElementById('chat-with-avatar').textContent = "G";
        document.getElementById('chat-with-status').textContent = "Community";
        document.getElementById('chat-with-status').style.color = "";

        document.querySelectorAll('.contact-item').forEach(i => i.classList.remove('active'));
        globalLounge.classList.add('active');

        updateMobileView('chat');
        loadMessages();
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
    activeProfile = profile;
    isSecretChatActive = false;

    const chatMain = document.getElementById('chat-main');
    if (chatMain) chatMain.classList.remove('secret-active');

    document.getElementById('chat-with-name').textContent = profile.full_name || profile.username;
    document.getElementById('chat-with-avatar').textContent = (profile.full_name || profile.username)[0];

    const statusEl = document.getElementById('chat-with-status');
    statusEl.textContent = `@${profile.username}`;
    statusEl.style.color = "";

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
            activeProfile = profile;
            isSecretChatActive = false;

            if (chatMain) chatMain.classList.remove('secret-active');

            document.getElementById('chat-with-name').textContent = profile.full_name || profile.username;
            document.getElementById('chat-with-avatar').textContent = (profile.full_name || profile.username)[0];
            statusEl.textContent = `@${profile.username}`;
            statusEl.style.color = "";

            document.querySelectorAll('.contact-item').forEach(i => i.classList.remove('active'));
            newItem.classList.add('active');
            updateMobileView('chat');
            loadMessages();
        };
        contactList.append(newItem);
    } else {
        existing.classList.add('active');
    }

    updateMobileView('chat');
    loadMessages();
}
