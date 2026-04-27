const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware to block sensitive files and directories
app.use((req, res, next) => {
  const sensitiveFiles = ['package.json', 'package-lock.json', 'server.js', 'render.yaml', '.gitignore'];
  const segments = req.path.split('/');

  // Check if any segment of the path is a dotfile or matches sensitive filenames
  const isForbidden = segments.some(segment =>
    segment.startsWith('.') || sensitiveFiles.includes(segment)
  );

  if (isForbidden) {
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
