const express = require('express');
const path = require('path');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for compatibility with external CDNs
}));

// Block access to sensitive files
app.use((req, res, next) => {
  const sensitiveFiles = [
    'package.json',
    'package-lock.json',
    'render.yaml',
    'server.js',
    'server_output.log',
    '.gitignore',
    'SUPABASE_SETUP.sql'
  ];

  const requestedFile = path.basename(req.path);
  const isHidden = req.path.split('/').some(segment => segment.startsWith('.'));

  // Block if it's in the list or if any part of the path is hidden
  if (sensitiveFiles.includes(requestedFile) || isHidden) {
    return res.status(403).send('Forbidden');
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
