const express = require('express');
const path = require('path');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 3000;

// Use helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "https://cdn.jsdelivr.net", "https://www.gstatic.com", "'unsafe-inline'"],
      "connect-src": ["'self'", "https://*.supabase.co", "https://*.firebaseio.com", "https://*.googleapis.com"],
      "img-src": ["'self'", "data:", "https://*.supabase.co"],
    },
  },
}));

// Middleware to block access to sensitive files
app.use((req, res, next) => {
  const sensitiveFiles = ['package.json', 'package-lock.json', 'render.yaml', 'README.md'];
  const isHidden = req.path.split('/').some(part => part.startsWith('.'));

  if (sensitiveFiles.includes(path.basename(req.path)) || isHidden) {
    return res.status(403).send('Access Denied');
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

// Fallback for all other routes to index.html (SPA-like behavior if needed)
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
