const express = require('express');
const path = require('path');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 3000;

// Security headers with Helmet and custom CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "www.gstatic.com"],
      "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      "font-src": ["'self'", "fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "zynochat.in"],
      "connect-src": ["'self'", "*.supabase.co", "*.firebaseio.com", "googleapis.com"],
      "frame-src": ["'self'"],
      "upgrade-insecure-requests": [],
    },
  },
}));

// Middleware to block public access to sensitive files and hidden directories
app.use((req, res, next) => {
  const forbiddenFiles = [
    'package.json',
    'package-lock.json',
    '.gitignore',
    'render.yaml',
    'SUPABASE_SETUP.sql'
  ];

  const parts = req.path.split('/');
  const isHidden = parts.some(part => part.startsWith('.'));
  const isForbiddenFile = forbiddenFiles.includes(path.basename(req.path));

  if (isHidden || isForbiddenFile) {
    return res.status(403).send('Forbidden: Access to this resource is restricted.');
  }
  next();
});

// Serve static files from the current directory
app.use(express.static(path.join(__dirname, '.')));

// Route for the login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Route for the chat page
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'chat.html'));
});

// Fallback for all other routes to index.html (SPA-like behavior)
app.get('/:any', (req, res, next) => {
  // If it's a file request (has extension), let static middleware handle it or 404
  if (req.path.includes('.')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
