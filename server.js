const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['https://zynochat.in', 'http://localhost:3000', 'http://localhost:8000'],
    credentials: true
  }
});

// Environment variables or robust fallbacks
const JWT_SECRET = process.env.JWT_SECRET || 'zyno_super_secret_unbreakable_cosmic_key_2025';
const PORT = process.env.PORT || 3000;

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Max 30 attempts per 15 mins
  message: { error: 'Too many authentication attempts. Account lockout protection is active.' }
});

// Helmet Config
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://www.gstatic.com"],
      connectSrc: ["'self'", "wss://*", "https://*.supabase.co", "wss://*.supabase.co"],
      imgSrc: ["'self'", "data:", "https://*.supabase.co", "https://zynochat.in", "https://user-images.githubusercontent.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));

// Request body parser with sizing limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Log Audit Helper
async function logAudit(userId, action, details = {}) {
  try {
    const logItem = {
      id: uuidv4(),
      userId: userId || 'system',
      action,
      details,
      timestamp: new Date().toISOString()
    };
    await db.audit_logs.create(logItem);
  } catch (err) {
    console.error('Audit logger failure:', err);
  }
}

// ── SECURITY INTERCEPTOR ─────────────────────────────────────
// Enforce block of raw sensitive files and server-side codes from public routes
const SENSITIVE_FILES = new Set([
  'package.json', 'package-lock.json', 'server.js', 'render.yaml',
  '.gitignore', 'readme.md', 'supabase_setup.sql', 'requirements.txt',
  'main.py', 'server.log', 'server_output.log', 'server_test.log', 'db.js', 'backend_test.js'
]);
const FORBIDDEN_EXTENSIONS = ['.py', '.sql', '.yaml', '.log', '.env', '.json', '.bak'];

app.use((req, res, next) => {
  const cleanPath = req.path.toLowerCase().replace(/\\/g, '/');
  const segments = cleanPath.split('/').filter(Boolean);

  for (const seg of segments) {
    if (SENSITIVE_FILES.has(seg) || seg.startsWith('.')) {
      return res.status(403).json({ error: 'Forbidden: Access is denied.' });
    }
    if (FORBIDDEN_EXTENSIONS.some(ext => seg.endsWith(ext))) {
      return res.status(403).json({ error: 'Forbidden: Access is denied.' });
    }
  }

  // Clean URL redirection logic
  if (req.path.endsWith('/index.html')) {
    const parentPath = req.path.slice(0, -10) || '/';
    return res.redirect(307, parentPath);
  }
  if (req.path.endsWith('.html')) {
    const cleanRoute = req.path.slice(0, -5);
    return res.redirect(307, cleanRoute);
  }

  next();
});

// Serve frontend assets cleanly
app.use(express.static(path.join(__dirname, '.')));

// Explicit paths to clean URL html files
const HTML_PAGES = ['login', 'chat', 'admin', 'profile', 'settings', 'ai-chat', 'channel', 'about', 'blog', 'privacy-policy', 'terms-and-conditions', 'refund-policy', 'cookie-policy', 'disclaimer'];
HTML_PAGES.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, `${page}.html`));
  });
});

// Middleware: Authenticate User via JWT Session Cookie or Bearer Token
async function authenticate(req, res, next) {
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Session token missing.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const session = db.sessions.queryById(decoded.sessionId);
    if (!session || session.token !== token) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired session.' });
    }

    const user = db.users.queryById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found.' });
    }
    if (user.isBanned) {
      return res.status(403).json({ error: 'Forbidden: Your account has been suspended.' });
    }

    req.user = user;
    req.sessionId = decoded.sessionId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Verification failed.' });
  }
}

// Middleware: RBAC Admin Gatekeeper
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    logAudit(req.user ? req.user.id : 'anonymous', 'unauthorized_admin_access_attempt', { path: req.path });
    return res.status(403).json({ error: 'Forbidden: Admin access required.' });
  }
  next();
}

// ── REST API ROUTES ──────────────────────────────────────────

// 1. Auth: Register
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, Email and Password are required.' });
  }
  if (username.length < 3 || password.length < 6) {
    return res.status(400).json({ error: 'Username (min 3 chars) and Password (min 6 chars) fail security guidelines.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      role: 'user',
      isBanned: false,
      createdAt: new Date().toISOString()
    };

    await db.users.create(newUser);
    await logAudit(newUser.id, 'register_success', { username });
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

// 2. Auth: Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Credentials are required.' });
  }

  try {
    const users = db.users.read();
    const user = users.find(u =>
      u.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
      u.email.toLowerCase() === usernameOrEmail.toLowerCase()
    );

    if (!user) {
      await logAudit(null, 'failed_login_attempt', { credentials: usernameOrEmail });
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    if (user.isBanned) {
      await logAudit(user.id, 'banned_user_login_attempt');
      return res.status(403).json({ error: 'Forbidden: Your account has been suspended.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      await logAudit(user.id, 'failed_password_attempt');
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    const sessionId = uuidv4();
    const token = jwt.sign({ userId: user.id, sessionId }, JWT_SECRET, { expiresIn: '7d' });

    // Store secure session
    await db.sessions.create({
      id: sessionId,
      userId: user.id,
      token,
      createdAt: new Date().toISOString()
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    await logAudit(user.id, 'login_success');
    res.json({ message: 'Logged in successfully', user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Internal server login error.' });
  }
});

// 3. Auth: Logout
app.post('/api/auth/logout', authenticate, async (req, res) => {
  try {
    await db.sessions.delete(req.sessionId);
    res.clearCookie('token');
    await logAudit(req.user.id, 'logout_success');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed.' });
  }
});

// 4. Auth: Get Current Session Profile
app.get('/api/auth/session', authenticate, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role
  });
});

// 5. Auth: Reset / Forgot password dummy simulation with security logs
app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }
  if (email.length > 100) {
    return res.status(400).json({ error: 'Email exceeds maximum allowed length.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.users.read().find(u => u.email.toLowerCase() === cleanEmail);
  if (user) {
    await logAudit(user.id, 'password_reset_requested', { email: cleanEmail });
  }
  // Standard timing attack safety response (always return ok)
  res.json({ message: 'If an account exists with this email, a reset code was sent.' });
});

// 6. Users: Search Profiles
app.get('/api/users/search', authenticate, (req, res) => {
  const query = (req.query.q || '').toLowerCase();
  if (query.length < 2) return res.json([]);

  const users = db.users.read();
  const matched = users
    .filter(u => u.id !== req.user.id && !u.isBanned && (u.username.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)))
    .map(u => ({ id: u.id, username: u.username }));

  res.json(matched);
});

// 7. Chats & Messages: Retrieve clean chats
app.get('/api/chats', authenticate, (req, res) => {
  const chats = db.chats.queryByUser(req.user.id);
  res.json(chats);
});

// 8. Chats: Create/Open direct conversation
app.post('/api/chats', authenticate, async (req, res) => {
  const { type, recipientId } = req.body;
  if (!type || !recipientId) return res.status(400).json({ error: 'Chat parameters invalid.' });

  try {
    const existing = db.chats.read().find(c =>
      c.type === 'direct' &&
      c.participantIds.includes(req.user.id) &&
      c.participantIds.includes(recipientId)
    );

    if (existing) {
      return res.json(existing);
    }

    const recipient = db.users.queryById(recipientId);
    if (!recipient) return res.status(404).json({ error: 'Recipient user not found.' });

    const newChat = {
      id: uuidv4(),
      type: 'direct',
      participantIds: [req.user.id, recipientId],
      createdAt: new Date().toISOString()
    };

    await db.chats.create(newChat);
    res.status(201).json(newChat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create chat.' });
  }
});

// 9. Messages: Retrieve message log for active chat
app.get('/api/messages/:chatId', authenticate, (req, res) => {
  const { chatId } = req.params;

  // Verify user is member of chat to prevent IDOR
  const chat = db.chats.queryById(chatId);
  if (!chat || !chat.participantIds.includes(req.user.id)) {
    return res.status(403).json({ error: 'Unauthorized direct object access of messages.' });
  }

  const messages = db.messages.queryByChat(chatId);
  res.json(messages);
});

// 10. Groups: Create group conversation
app.post('/api/groups', authenticate, async (req, res) => {
  const { name, memberIds } = req.body;
  if (!name || !Array.isArray(memberIds)) {
    return res.status(400).json({ error: 'Group name and initial member array required.' });
  }

  try {
    const groupId = uuidv4();
    const groupMembers = [...new Set([req.user.id, ...memberIds])];

    const newGroup = {
      id: groupId,
      name,
      memberIds: groupMembers,
      createdAt: new Date().toISOString()
    };

    const newChat = {
      id: groupId,
      type: 'group',
      participantIds: groupMembers,
      createdAt: new Date().toISOString()
    };

    await db.groups.create(newGroup);
    await db.chats.create(newChat);

    await logAudit(req.user.id, 'group_created', { name, groupId });
    res.status(201).json(newGroup);
  } catch (err) {
    res.status(500).json({ error: 'Group creation failed.' });
  }
});

// 11. Reports: File a report against spammers
app.post('/api/reports', authenticate, async (req, res) => {
  const { reportedId, reason } = req.body;
  if (!reportedId || !reason) return res.status(400).json({ error: 'Report params invalid.' });

  try {
    const newReport = {
      id: uuidv4(),
      reporterId: req.user.id,
      reportedId,
      reason,
      createdAt: new Date().toISOString()
    };
    await db.reports.create(newReport);
    await logAudit(req.user.id, 'report_filed', { reportedId });
    res.status(201).json({ message: 'Thank you for your report. Moderation team has been notified.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to file report.' });
  }
});

// 12. Admin Controls: View Users list
app.get('/api/admin/users', authenticate, requireAdmin, (req, res) => {
  const users = db.users.read().map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    isBanned: u.isBanned,
    createdAt: u.createdAt
  }));
  res.json(users);
});

// 13. Admin Controls: Ban / Suspend user
app.post('/api/admin/ban/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const target = db.users.queryById(req.params.userId);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'admin') return res.status(400).json({ error: 'Cannot ban another administrator.' });

    await db.users.update(req.params.userId, { isBanned: true });

    // Revoke target active sessions
    const sessions = db.sessions.queryByUser(req.params.userId);
    for (const s of sessions) {
      await db.sessions.delete(s.id);
    }

    await logAudit(req.user.id, 'admin_ban_user', { targetId: target.id, username: target.username });
    res.json({ message: `Successfully banned user @${target.username}` });
  } catch (err) {
    res.status(500).json({ error: 'Banning user failed.' });
  }
});

// 14. Admin Controls: Unban / Restore User
app.post('/api/admin/unban/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const target = db.users.queryById(req.params.userId);
    if (!target) return res.status(404).json({ error: 'User not found' });

    await db.users.update(req.params.userId, { isBanned: false });
    await logAudit(req.user.id, 'admin_unban_user', { targetId: target.id, username: target.username });
    res.json({ message: `Successfully restored user @${target.username}` });
  } catch (err) {
    res.status(500).json({ error: 'Restoring user failed.' });
  }
});

// 15. Admin Controls: Reports List
app.get('/api/admin/reports', authenticate, requireAdmin, (req, res) => {
  res.json(db.reports.read());
});

// 16. Admin Controls: Suspicious Activity Audit Trail
app.get('/api/admin/audit-logs', authenticate, requireAdmin, (req, res) => {
  const logs = db.audit_logs.read().slice(-50).reverse(); // Last 50 audits
  res.json(logs);
});

// ── SOCKET.IO REALTIME PRESENCE & CHAT IMPLEMENTATION ───────
const onlineUsers = new Map(); // Map of userId -> socket.id

io.on('connection', (socket) => {
  let authenticatedUserId = null;

  // Real-time Authentication registration on websocket connect
  socket.on('register_presence', async ({ token }) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      authenticatedUserId = decoded.userId;
      onlineUsers.set(authenticatedUserId, socket.id);

      // Join standard private room
      socket.join(authenticatedUserId);

      // Broadcast user online state globally
      io.emit('presence_change', { userId: authenticatedUserId, status: 'online' });
    } catch (err) {
      // Discard invalid/failed socket auths silently
    }
  });

  // Typing state indicator
  socket.on('typing_indicator', ({ recipientId, isTyping }) => {
    if (!authenticatedUserId) return;
    socket.to(recipientId).emit('typing_status', { senderId: authenticatedUserId, isTyping });
  });

  // Real-time Messaging
  socket.on('send_message', async ({ chatId, text }) => {
    if (!authenticatedUserId) return;

    try {
      const chat = db.chats.queryById(chatId);
      if (!chat || !chat.participantIds.includes(authenticatedUserId)) return;

      const messageObj = {
        id: uuidv4(),
        chatId,
        senderId: authenticatedUserId,
        text,
        createdAt: new Date().toISOString()
      };

      await db.messages.create(messageObj);

      const senderProfile = db.users.queryById(authenticatedUserId);

      // Construct a clean, highly formatted packet
      const wsMessage = {
        ...messageObj,
        sender: {
          username: senderProfile.username,
          role: senderProfile.role
        }
      };

      // Disseminate to all active members inside the conversations
      chat.participantIds.forEach(pId => {
        io.to(pId).emit('new_message', wsMessage);
      });
    } catch (err) {
      console.error('Socket message transmission fail:', err);
    }
  });

  socket.on('disconnect', () => {
    if (authenticatedUserId) {
      onlineUsers.delete(authenticatedUserId);
      io.emit('presence_change', { userId: authenticatedUserId, status: 'offline', lastSeen: new Date().toISOString() });
    }
  });
});

// Global Secure Fallback Error Handler (prevents diagnostic/internal code leaks)
app.use((err, req, res, next) => {
  console.error('Unexpected error trace:', err.stack);
  res.status(500).json({ error: 'A secure database system error occurred.' });
});

// Start our cosmic real-time production server
server.listen(PORT, () => {
  console.log(`🚀 Zynochat Highly Secured Lounge listening at http://localhost:${PORT}`);
});
