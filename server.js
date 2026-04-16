const express = require('express');
const path = require('path');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 3000;

// Security headers with Helmet
// Configured to allow Supabase, Firebase, and Google Fonts CDNs
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "https://cdn.jsdelivr.net", "https://www.gstatic.com"],
      "connect-src": ["'self'", "https://*.supabase.co", "https://*.firebaseio.com", "https://*.googleapis.com", "https://www.gstatic.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "https://*.supabase.co", "https://*.googleusercontent.com"],
    },
  },
}));

// Block access to sensitive files and directories
app.use((req, res, next) => {
  const sensitiveFiles = ['package.json', 'package-lock.json', 'render.yaml', '.gitignore', 'README.md'];
  const filename = req.path.split('/').pop();

  if (sensitiveFiles.includes(filename) || req.path.includes('/.git')) {
    return res.status(403).send('Access Forbidden');
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
