const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://www.gstatic.com"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
      imgSrc: ["'self'", "data:", "https://*.supabase.co", "https://zynochat.in"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// 2. CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// 4. Prevent Parameter Pollution
app.use(hpp());

// 5. Body Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 6. Block Sensitive Files and Hidden Directories
app.use((req, res, next) => {
  const segments = req.path.split('/');
  const isHidden = segments.some(segment => segment.startsWith('.') && segment.length > 1);
  const sensitiveFiles = ['package.json', 'package-lock.json', 'server.js', 'render.yaml', '.gitignore', 'README.md'];

  if (isHidden || sensitiveFiles.includes(segments[segments.length - 1])) {
    return res.status(403).send('Forbidden: Access is denied.');
  }
  next();
});

// Serve static files from the current directory
app.use(express.static(path.join(__dirname, '.'), {
  dotfiles: 'deny',
  index: false
}));

// Route for the login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Route for the chat page
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'chat.html'));
});

// Route for the admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// SPA Catch-all for Express 5
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get(/^(?!\/(login|chat|admin)$|.*\.).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong! Our team is notified.');
});

app.listen(PORT, () => {
  console.log(`Server is running securely on http://localhost:${PORT}`);
});
