const express = require('express');
const path = require('path');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 3000;

// Use helmet for security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now to avoid breaking existing CDN imports
}));

// Middleware to block access to sensitive files
app.use((req, res, next) => {
  const sensitiveFiles = [
    'package.json',
    'package-lock.json',
    'render.yaml',
    'server.js',
    'server_output.log',
    'admin.html',
    '.gitignore'
  ];

  const requestedFile = path.basename(req.path);

  // Block specific sensitive files or any hidden files (starting with .)
  if (sensitiveFiles.includes(requestedFile) || requestedFile.startsWith('.')) {
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
