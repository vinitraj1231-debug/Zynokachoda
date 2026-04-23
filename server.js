const express = require('express');
const path = require('path');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to avoid breaking existing CDN scripts/styles
}));

// Block access to sensitive files
const sensitiveFiles = [
  'package.json',
  'package-lock.json',
  'server.js',
  '.gitignore',
  'render.yaml',
  'server_output.log',
  'SUPABASE_SETUP.sql'
];

app.use((req, res, next) => {
  const fileName = path.basename(req.path);
  if (sensitiveFiles.includes(fileName) || req.path.split('/').some(segment => segment.startsWith('.'))) {
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
